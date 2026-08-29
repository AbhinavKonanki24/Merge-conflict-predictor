import * as ts from 'typescript';

export function getEnclosingFunction(filePath: string, lineNumber: number, fileContent: string): string | null {
  // Only parse JS/TS files
  if (!/\.(tsx?|jsx?)$/i.test(filePath)) {
    return null;
  }

  const sourceFile = ts.createSourceFile(
    filePath,
    fileContent,
    ts.ScriptTarget.Latest,
    true
  );

  let targetNode: ts.Node | null = null;
  
  // lineNumber is 1-indexed for the user's perspective.
  const targetLine = lineNumber - 1;

  function findNode(node: ts.Node) {
    const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
    
    if (targetLine >= startLine && targetLine <= endLine) {
      if (
        ts.isFunctionDeclaration(node) ||
        ts.isMethodDeclaration(node) ||
        ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isClassDeclaration(node)
      ) {
        targetNode = node;
      }
      ts.forEachChild(node, findNode);
    }
  }

  findNode(sourceFile);

  if (targetNode) {
    const node = targetNode as ts.Node;
    // If we matched a class, let's treat it as the "function" or structural block.
    if (ts.isClassDeclaration(node)) {
       return node.name ? node.name.text : "anonymous class";
    }

    if ((node as any).name && ts.isIdentifier((node as any).name)) {
      return ((node as any).name as ts.Identifier).text;
    }
    
    // For arrow functions and function expressions bound to variables/properties
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      if (node.parent) {
        if (ts.isVariableDeclaration(node.parent) && ts.isIdentifier(node.parent.name)) {
          return node.parent.name.text;
        }
        if (ts.isPropertyAssignment(node.parent) && ts.isIdentifier(node.parent.name)) {
          return node.parent.name.text;
        }
      }
      return "anonymous function";
    }
  }

  return null;
}
