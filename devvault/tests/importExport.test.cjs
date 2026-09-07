const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the real commands against an isolated VS Code API, without installing extensions.
function loadModule(relativePath, vscode) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => name === 'vscode'
    ? vscode
    : loadModule(path.resolve(path.dirname(filename), `${name}.ts`), vscode);
  vm.runInThisContext(`(function(require, module, exports) {${source}\n})`, { filename })(
    localRequire, module, module.exports,
  );
  return module.exports;
}

const extension = (id, version = '1.0.0') => ({ id, name: id, version });

test('managing profiles reports rejected dialogs without an unhandled rejection', async () => {
  const failure = new TypeError('undefined is not iterable');
  const errors = [];
  const logs = [];
  const originalError = console.error;
  console.error = (...args) => logs.push(args);
  try {
    const vscode = { window: {
      showQuickPick: async () => { throw failure; },
      showErrorMessage: async (message) => errors.push(message),
    } };
    const { manageProfiles } = loadModule('src/commands/manageProfiles.ts', vscode);
    await manageProfiles({ getAll: () => [{ name: 'Original', description: '', extensions: [] }] });
    assert.match(errors[0], /DevVault.*undefined is not iterable/);
    assert.equal(logs[0][1], failure);
  } finally {
    console.error = originalError;
  }
});

test('cancelling profile editing preserves the stored profile', async () => {
  const profiles = [{ name: 'Original', description: 'Description', extensions: [] }];
  let picks = 0;
  let saves = 0;
  const vscode = { window: {
    showQuickPick: async (items) => ++picks <= 2 ? items[0] : undefined,
    showInputBox: async () => 'Changed',
  } };
  const { manageProfiles } = loadModule('src/commands/manageProfiles.ts', vscode);
  await manageProfiles({ getAll: () => profiles, save: async () => { saves++; } });
  assert.equal(profiles[0].name, 'Original');
  assert.equal(profiles[0].description, 'Description');
  assert.equal(saves, 0);
});

const document = (extensions = []) => ({
  version: 1, profile: { name: 'Meu perfil', description: '', extensions },
});

function setup(data = document(), options = {}) {
  const calls = { saves: [], installs: [], errors: [], warnings: [], messages: [], progress: [], writes: [] };
  const vscode = {
    ProgressLocation: { Notification: 15 },
    Uri: { file: (value) => value },
    extensions: { all: (options.installed || []).map((item) => ({
      id: item.id, packageJSON: { version: item.version },
    })) },
    commands: { executeCommand: async (command, id) => {
      assert.equal(command, 'workbench.extensions.installExtension');
      calls.installs.push(id);
      if (id === options.failInstall) throw new Error('Installation failed');
    } },
    workspace: { fs: {
      readFile: async () => Buffer.from(options.raw ?? JSON.stringify(data)),
      writeFile: async (uri, bytes) => {
        if (options.failWrite) throw new Error('Permission denied');
        calls.writes.push(JSON.parse(bytes.toString()));
      },
    } },
    window: {
      showOpenDialog: async () => options.cancelOpen ? undefined : ['profile.json'],
      showSaveDialog: async () => options.cancelSave ? undefined : 'profile.json',
      showQuickPick: async (items) => options.cancelPick ? undefined : items[0],
      showInformationMessage: async (message, ...items) => {
        calls.messages.push(message);
        if (items.includes('Importar perfil')) return options.cancelImport ? undefined : 'Importar perfil';
        if (items.includes('Importar favoritos')) return options.cancelImport ? undefined : 'Importar favoritos';
        if (items.includes('Instalar agora')) return options.later ? 'Fazer depois' : 'Instalar agora';
      },
      showWarningMessage: async (message, ...items) => {
        calls.warnings.push(message);
        if (items.includes('Substituir')) return options.cancelReplace ? undefined : 'Substituir';
      },
      showErrorMessage: async (message) => { calls.errors.push(message); },
      withProgress: async (settings, task) => {
        assert.equal(settings.cancellable, false);
        return task({ report: (value) => calls.progress.push(value) });
      },
    },
  };
  const service = {
    getAll: () => structuredClone(options.profiles || []),
    save: async (profiles) => { calls.saves.push(structuredClone(profiles)); },
  };
  return {
    calls,
    runImport: () => loadModule('src/commands/importProfile.ts', vscode).importProfile(service),
    runExport: () => loadModule('src/commands/exportProfile.ts', vscode).exportProfile(service),
    runImportFavorites: () => loadModule('src/commands/importFavorites.ts', vscode).importFavorites(service),
    runExportFavorites: () => loadModule('src/commands/exportFavorites.ts', vscode).exportFavorites(service),
  };
}

test('rejects malformed fields before saving or installing', async () => {
  const invalid = [null, [], { ...document(), version: 2 }];
  for (const [key, value] of [['name', 1], ['name', ' '], ['description', null], ['extensions', {}]]) {
    invalid.push({ ...document(), profile: { ...document().profile, [key]: value } });
  }
  for (const item of [null, {}, extension(12), extension(''), extension('a.b', 12), extension('a.b', ' '), { ...extension('a.b'), name: null }]) {
    invalid.push(document([item]));
  }
  for (const data of invalid) {
    const app = setup(data);
    await app.runImport();
    assert.equal(app.calls.errors.length, 1);
    assert.equal(app.calls.saves.length, 0);
    assert.equal(app.calls.installs.length, 0);
  }
});

test('accepts exported profiles with empty description, empty extensions and UTF-8 BOM', async () => {
  const data = document();
  const app = setup(data, { raw: '\uFEFF' + JSON.stringify(data) });
  await app.runImport();
  assert.deepEqual(app.calls.saves, [[data.profile]]);
  assert.equal(app.calls.errors.length, 0);
});

test('installs missing and older extensions, preserving equal and newer versions', async () => {
  const data = document(['missing.ext', 'older.ext', 'equal.ext', 'newer.ext'].map((id) => extension(id, '2.0.0')));
  const app = setup(data, { installed: [extension('OLDER.EXT'), extension('equal.ext', '2.0.0'), extension('newer.ext', '3.0.0')] });
  await app.runImport();
  assert.deepEqual(app.calls.installs, ['missing.ext@2.0.0', 'older.ext@2.0.0']);
  assert.equal(app.calls.progress.filter((item) => item.message).length, 2);
  assert.equal(app.calls.progress.reduce((sum, item) => sum + (item.increment || 0), 0), 100);
});

test('respects cancellation and allows installation later', async () => {
  for (const option of ['cancelOpen', 'cancelImport', 'cancelReplace']) {
    const app = setup(document([extension('a.b')]), { [option]: true, profiles: [document().profile] });
    await app.runImport();
    assert.equal(app.calls.saves.length, 0);
    assert.equal(app.calls.installs.length, 0);
  }
  const app = setup(document([extension('a.b')]), { later: true });
  await app.runImport();
  assert.equal(app.calls.saves.length, 1);
  assert.equal(app.calls.installs.length, 0);
});

test('replaces a confirmed matching profile without adding a duplicate', async () => {
  const data = document([extension('a.b')]);
  const app = setup(data, { profiles: [{ ...document().profile, name: ' MEU PERFIL ' }], later: true });
  await app.runImport();
  assert.deepEqual(app.calls.saves, [[data.profile]]);
});

test('continues after installation failure and completes progress', async () => {
  const app = setup(document([extension('a.b'), extension('c.d')]), { failInstall: 'a.b@1.0.0' });
  await app.runImport();
  assert.equal(app.calls.installs.length, 2);
  assert.equal(app.calls.warnings.length, 1);
  assert.equal(app.calls.progress.reduce((sum, item) => sum + (item.increment || 0), 0), 100);
});

test('handles invalid JSON without changing saved profiles', async () => {
  const app = setup(undefined, { raw: '{broken' });
  await app.runImport();
  assert.equal(app.calls.errors.length, 1);
  assert.equal(app.calls.saves.length, 0);
});

test('export retains the v1 format and can be imported again', async () => {
  const data = document([extension('a.b')]);
  const app = setup(data, { profiles: [data.profile] });
  await app.runExport();
  assert.deepEqual(app.calls.writes, [data]);
  const imported = setup(app.calls.writes[0], { later: true });
  await imported.runImport();
  assert.deepEqual(imported.calls.saves, [[data.profile]]);
});

test('export reports write failures without reporting success', async () => {
  const app = setup(undefined, { profiles: [document().profile], failWrite: true });
  await app.runExport();
  assert.equal(app.calls.errors.length, 1);
  assert.equal(app.calls.messages.length, 0);
});

test('export respects cancelled dialogs and empty profile lists', async () => {
  for (const options of [{ cancelPick: true }, { cancelSave: true }, { profiles: [] }]) {
    const app = setup(undefined, { profiles: [document().profile], ...options });
    await app.runExport();
    assert.equal(app.calls.writes.length, 0);
    assert.equal(app.calls.errors.length, 0);
  }
});

const favoritesDocument = (extensions = []) => ({ version: 1, type: 'favorites', extensions });

test('favorites export round trips through import', async () => {
  const data = favoritesDocument([extension('a.b')]);
  const app = setup(data, { profiles: data.extensions });
  await app.runExportFavorites();
  assert.deepEqual(app.calls.writes, [data]);
  const imported = setup(data, { later: true, raw: '\uFEFF' + JSON.stringify(data) });
  await imported.runImportFavorites();
  assert.deepEqual(imported.calls.saves, [data.extensions]);
});

test('favorites merge preserves highest versions and installs each missing or older ID once', async () => {
  const data = favoritesDocument([
    extension('missing.ext', '2.0.0'), extension('MISSING.EXT'),
    extension('older.ext', '2.0.0'), extension('equal.ext', '2.0.0'), extension('newer.ext', '2.0.0'),
  ]);
  const app = setup(data, {
    profiles: [extension('OLDER.EXT', '3.0.0'), extension('kept.ext')],
    installed: [extension('older.ext'), extension('equal.ext', '2.0.0'), extension('newer.ext', '3.0.0')],
  });
  await app.runImportFavorites();
  assert.deepEqual(app.calls.installs, ['missing.ext@2.0.0', 'older.ext@2.0.0']);
  assert.equal(app.calls.saves[0].length, 5);
  assert.deepEqual(app.calls.saves[0][0], extension('OLDER.EXT', '3.0.0'));
  assert.equal(app.calls.saves[0][1].id, 'kept.ext');
});

test('favorites rejects wrong formats and malformed entries without side effects', async () => {
  for (const data of [null, document(), { ...favoritesDocument(), version: 2 },
    { ...favoritesDocument(), type: 'profile' }, favoritesDocument([null]),
    favoritesDocument([extension('a.b', 12)]), favoritesDocument([extension(' ')]),
    favoritesDocument([{ ...extension('a.b'), name: null }])]) {
    const app = setup(data);
    await app.runImportFavorites();
    assert.equal(app.calls.errors.length, 1);
    assert.equal(app.calls.saves.length, 0);
    assert.equal(app.calls.installs.length, 0);
  }
});

test('favorites cancellation and deferred installation preserve user choice', async () => {
  for (const option of ['cancelOpen', 'cancelImport']) {
    const app = setup(favoritesDocument([extension('a.b')]), { [option]: true });
    await app.runImportFavorites();
    assert.equal(app.calls.saves.length, 0);
    assert.equal(app.calls.installs.length, 0);
  }
  const app = setup(favoritesDocument([extension('a.b')]), { later: true });
  await app.runImportFavorites();
  assert.equal(app.calls.saves.length, 1);
  assert.equal(app.calls.installs.length, 0);
});

test('favorites continues after installation failures and reports partial success', async () => {
  const app = setup(favoritesDocument([extension('a.b'), extension('c.d')]), { failInstall: 'a.b@1.0.0' });
  await app.runImportFavorites();
  assert.equal(app.calls.installs.length, 2);
  assert.equal(app.calls.warnings.length, 1);
});

test('favorites export handles empty lists, cancellation and write failures', async () => {
  for (const options of [{ profiles: [] }, { cancelSave: true }, { failWrite: true }]) {
    const app = setup(undefined, { profiles: [extension('a.b')], ...options });
    await app.runExportFavorites();
    assert.equal(app.calls.writes.length, 0);
    assert.equal(app.calls.errors.length, options.failWrite ? 1 : 0);
    if (options.failWrite) assert.equal(app.calls.messages.length, 0);
  }
});
