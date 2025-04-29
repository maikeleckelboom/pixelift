import ts from 'typescript';
import * as fs from 'fs';

// Simple function to check exports in a .d.ts file
function checkTypes(filePath: string): void {
  console.log(`\nChecking ${filePath}...`);

  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  const exports: string[] = [];

  // Find export declarations
  ts.forEachChild(sourceFile, (node) => {
    if (ts.isExportDeclaration(node)) {
      console.log('- Found export declaration');

      // Check if it has a module specifier (re-export)
      if (node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
        console.log(`  From module: ${node.moduleSpecifier.text}`);
      }

      // Check named exports
      if (node.exportClause && ts.isNamedExports(node.exportClause)) {
        node.exportClause.elements.forEach((element) => {
          exports.push(element.name.text);
        });
      }
    }
  });

  // Show what was found
  if (exports.length > 0) {
    console.log(`Found ${exports.length} exported symbols: ${exports.join(', ')}`);
  } else {
    console.log('No named exports found (there might be default exports)');
  }
}

// Files to check
const files =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : ['./dist/browser/browser.d.ts', './dist/server/server.d.ts'];

console.log('Type Export Checker');
console.log('==================');
files.forEach(checkTypes);
