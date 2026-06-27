import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface CodeFileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: CodeFileNode[];
}

function getFileTree(dirPath: string, relativeRoot: string = ''): CodeFileNode[] {
  const result: CodeFileNode[] = [];
  try {
    if (!fs.existsSync(dirPath)) return result;
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      if (file === 'bin' || file === 'obj' || file === '.git' || file === 'node_modules') continue;
      
      const fullPath = path.join(dirPath, file);
      const relPath = path.join(relativeRoot, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        result.push({
          name: file,
          path: relPath,
          type: 'directory',
          children: getFileTree(fullPath, relPath),
        });
      } else {
        result.push({
          name: file,
          path: relPath,
          type: 'file',
        });
      }
    }
  } catch (err) {
    console.error('Error scanning C# source tree', err);
  }

  // Sort directories first, then files
  return result.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('file');

  const csharpDir = path.join(process.cwd(), 'csharp-src');

  if (filePath) {
    // Return specific file contents
    // Prevent directory traversal attacks
    const safePath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    const absolutePath = path.join(csharpDir, safePath);

    if (!absolutePath.startsWith(csharpDir)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!fs.existsSync(absolutePath) || fs.statSync(absolutePath).isDirectory()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    try {
      const content = fs.readFileSync(absolutePath, 'utf-8');
      return NextResponse.json({ content, path: safePath });
    } catch (err) {
      return NextResponse.json({ error: 'Error reading file' }, { status: 500 });
    }
  }

  // Return the entire directory tree structure
  const tree = getFileTree(csharpDir);
  return NextResponse.json({ tree });
}
