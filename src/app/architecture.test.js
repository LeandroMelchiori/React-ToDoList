import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import ts from 'typescript';

const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const walk = directory => readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
const sources = walk(sourceRoot).filter(file => /\.[jt]sx?$/.test(file) && !/\.(test|spec)\./.test(file) && !file.endsWith('.d.ts'));
const relative = file => path.relative(sourceRoot, file).replaceAll('\\', '/');

function dependencies() {
  return sources.flatMap(file => {
    const ast = ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    const found = [];
    const add = specifier => {
      const target = specifier.startsWith('.') ? relative(path.resolve(path.dirname(file), specifier)) : specifier;
      found.push({ source: relative(file), target, specifier });
    };
    const visit = node => {
      if ((ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) add(node.moduleSpecifier.text);
      if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) add(node.arguments[0].text);
      ts.forEachChild(node, visit);
    };
    visit(ast);
    return found;
  });
}

describe('module boundaries', () => {
  test('server modules never depend on frontend or browser persistence', () => {
    const invalid = dependencies().filter(dependency => dependency.source.startsWith('server/') &&
      (/^(app\/|features\/|shared\/(ui|hooks)\/)/.test(dependency.target) || /^react(?:-dom)?(?:\/|$)/.test(dependency.target)));
    expect(invalid).toEqual([]);
  });

  test('the shared calendar domain remains pure and reusable by both runtimes', () => {
    const invalid = dependencies().filter(dependency => dependency.source.startsWith('shared/calendar/') &&
      !dependency.target.startsWith('shared/calendar/'));
    expect(invalid).toEqual([]);
    const globals = sources.filter(file => relative(file).startsWith('shared/calendar/')).flatMap(file => {
      const text = readFileSync(file, 'utf8');
      return /\b(window|document|localStorage|indexedDB)\s*\./.test(text) ? [relative(file)] : [];
    });
    expect(globals).toEqual([]);
  });

  test('features and shared code never depend on the application shell or server', () => {
    const invalid = dependencies().filter(dependency =>
      (dependency.source.startsWith('features/') || dependency.source.startsWith('shared/')) &&
      /^(app\/|server\/)/.test(dependency.target));
    expect(invalid).toEqual([]);
    expect(dependencies().filter(dependency => dependency.source.startsWith('shared/') && dependency.target.startsWith('features/'))).toEqual([]);
  });

  test('cross-feature access uses the declared sync entry points', () => {
    const syncEntries = new Set(['features/sync/storage', 'features/sync/useLocalStorage', 'features/sync/ChangeAlert']);
    const invalid = dependencies().filter(dependency => {
      const owner = dependency.source.match(/^features\/([^/]+)\//)?.[1];
      const targetOwner = dependency.target.match(/^features\/([^/]+)\//)?.[1];
      return owner && targetOwner && owner !== targetOwner && !syncEntries.has(dependency.target);
    });
    expect(invalid).toEqual([]);
  });
});
