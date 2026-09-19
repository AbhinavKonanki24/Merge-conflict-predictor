"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnclosingFunction = getEnclosingFunction;
const ts = __importStar(require("typescript"));
function getEnclosingFunction(filePath, lineNumber, fileContent) {
    // Only parse JS/TS files
    if (!/\.(tsx?|jsx?)$/i.test(filePath)) {
        return null;
    }
    const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true);
    let targetNode = null;
    // lineNumber is 1-indexed for the user's perspective.
    const targetLine = lineNumber - 1;
    function findNode(node) {
        const { line: startLine } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
        const { line: endLine } = sourceFile.getLineAndCharacterOfPosition(node.getEnd());
        if (targetLine >= startLine && targetLine <= endLine) {
            if (ts.isFunctionDeclaration(node) ||
                ts.isMethodDeclaration(node) ||
                ts.isArrowFunction(node) ||
                ts.isFunctionExpression(node) ||
                ts.isClassDeclaration(node)) {
                targetNode = node;
            }
            ts.forEachChild(node, findNode);
        }
    }
    findNode(sourceFile);
    if (targetNode) {
        const node = targetNode;
        // If we matched a class, let's treat it as the "function" or structural block.
        if (ts.isClassDeclaration(node)) {
            return node.name ? node.name.text : "anonymous class";
        }
        if (node.name && ts.isIdentifier(node.name)) {
            return node.name.text;
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
