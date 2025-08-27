import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { FileNameGenerator } from './utils.js';

const toFileUri = p => "file:///" + p.replace(/\\/g,"/");

export async function savePDFAndMeta(buffer, { dir, basename, baseUrl, visitRound, projectName }) {
  await fs.mkdir(dir, { recursive: true });
  
  // 새로운 파일명 생성 로직 적용
  let filename;
  if (visitRound && projectName) {
    filename = FileNameGenerator.generateReportFileName({
      visitRound,
      projectName,
      extension: 'pdf'
    });
  } else {
    // 기존 방식 (하위 호환성)
    const stamp = new Date().toISOString().replace(/[:.]/g,"-");
    filename = `${basename}_${stamp}.pdf`;
  }
  
  const absPath = path.resolve(path.join(dir, filename));
  await fs.writeFile(absPath, buffer);

  const sha256 = crypto.createHash("sha256").update(buffer).digest("hex");
  const httpUrl = baseUrl ? `${baseUrl.replace(/\/$/,"")}/downloads/${encodeURIComponent(filename)}` : null;

  return {
    filename,
    absPath,
    fileUri: toFileUri(absPath),
    httpUrl,
    size: buffer.length,
    sha256,
    createdAt: new Date().toISOString()
  };
}

export async function ensureDirectory(dir) {
  try {
    await fs.access(dir);
  } catch {
    await fs.mkdir(dir, { recursive: true });
  }
}

export async function cleanupOldFiles(dir, maxAge = 7 * 24 * 60 * 60 * 1000) { // 7일
  try {
    const files = await fs.readdir(dir);
    const now = Date.now();
    
    for (const file of files) {
      if (file.endsWith('.pdf')) {
        const filePath = path.join(dir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          console.log(`오래된 파일 삭제: ${file}`);
        }
      }
    }
  } catch (error) {
    console.error('파일 정리 중 오류:', error);
  }
}
