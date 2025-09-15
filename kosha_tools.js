import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs-extra';
import { Builder, By, until } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome.js';
import chromedriver from 'chromedriver';
import { log } from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class KoshaTools {
  constructor() {
    this.currentUrl = null;
  }

  async executeKoshaSearch(args) {
    try {
      const {
        searchValue,
        category = "6",
        pageNo = "1",
        numOfRows = "3"
      } = args;

      const serviceKey = "2412dbcc3334b992d01beeb1c5a32b3d7d54c64e9f011056a04edff66e7aeb6b";
      const apiBaseUrl = "https://apis.data.go.kr/B552468/srch/smartSearch";

      if (!serviceKey) {
        throw new Error("serviceKey는 필수 매개변수입니다.");
      }
      if (!searchValue) {
        throw new Error("searchValue는 필수 매개변수입니다.");
      }

      const url = new URL(apiBaseUrl);
      url.searchParams.append('serviceKey', serviceKey);
      url.searchParams.append('pageNo', pageNo);
      url.searchParams.append('numOfRows', numOfRows);
      url.searchParams.append('searchValue', searchValue);
      url.searchParams.append('category', category);

      const startTime = Date.now();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('KOSHA API 요청 시간 초과 (30초)')), 30000)
      );
      const fetchPromise = fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'MCP-KOSHA-API-Tool/1.0.0',
          'Accept': 'application/json'
        }
      });
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const duration = Date.now() - startTime;

      let responseText;
      try {
        responseText = await response.text();
      } catch (error) {
        responseText = `[응답 본문을 읽을 수 없습니다: ${error.message}]`;
      }

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch (error) {
        parsedResponse = null;
      }

      const result = {
        success: response.ok,
        status_code: response.status,
        status_text: response.statusText,
        duration_ms: duration,
        search_params: { searchValue, category, pageNo, numOfRows },
        data: parsedResponse || responseText,
        raw_response: responseText
      };

      if (parsedResponse && parsedResponse.response && parsedResponse.response.body) {
        const body = parsedResponse.response.body;
        if (category === "6") {
          if (body.items && body.items.item && Array.isArray(body.items.item)) {
            body.items.item = body.items.item.filter(item => item.media_style === 'OPS');
            if (body.items.item.length > 3) {
              body.items.item = body.items.item.slice(0, 3);
            }
          }
          if (body.total_media && Array.isArray(body.total_media)) {
            body.total_media = body.total_media.filter(item => item.media_style === 'OPS');
            if (body.total_media.length > 2) {
              body.total_media = body.total_media.slice(0, 2);
            }
          }
        } else {
          if (body.items && body.items.item && Array.isArray(body.items.item)) {
            body.items.item = body.items.item.filter(item => item.media_style === 'OPS');
            if (body.items.item.length > 10) {
              body.items.item = body.items.item.slice(0, 10);
            }
          }
          if (body.total_media && Array.isArray(body.total_media)) {
            body.total_media = body.total_media.filter(item => item.media_style === 'OPS');
            if (body.total_media.length > 5) {
              body.total_media = body.total_media.slice(0, 5);
            }
          }
        }
        if (body.items && body.items.item) {
          body.items.item = body.items.item.map(item => ({
            ...item,
            title: item.title ? item.title.substring(0, category === "6" ? 50 : 100) : item.title,
            content: item.content ? item.content.substring(0, category === "6" ? 100 : 200) : item.content,
            description: item.description ? item.description.substring(0, category === "6" ? 80 : 150) : item.description
          }));
        }
        if (body.total_media) {
          body.total_media = body.total_media.map(item => ({
            ...item,
            title: item.title ? item.title.substring(0, category === "6" ? 50 : 100) : item.title,
            content: item.content ? item.content.substring(0, category === "6" ? 100 : 200) : item.content,
            description: item.description ? item.description.substring(0, category === "6" ? 80 : 150) : item.description
          }));
        }
        result.summary = {
          total_count: body.totalCount || 0,
          page_no: body.pageNo || pageNo,
          num_of_rows: body.numOfRows || numOfRows,
          items_count: body.items ? body.items.item.length : 0,
          total_media_count: body.total_media ? body.total_media.length : 0,
          filtered_ops_count: (body.items ? body.items.item.length : 0) + (body.total_media ? body.total_media.length : 0),
          note: "토큰 제한을 위해 결과가 제한되었습니다. 더 자세한 정보가 필요하면 구체적인 검색어를 사용해주세요."
        };
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    } catch (error) {
      const errorResult = {
        success: false,
        error: error.message,
        error_type: error.name || 'Error',
        search_params: {
          searchValue: args.searchValue,
          category: args.category || "0",
          pageNo: args.pageNo || "1",
          numOfRows: args.numOfRows || "100"
        }
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(errorResult, null, 2)
          }
        ]
      };
    }
  }

  detectFileType(url, mediaStyle = '') {
    const urlLower = url.toLowerCase();
    if (urlLower.includes('.pdf') || urlLower.includes('pdf')) return 'PDF';
    if (urlLower.includes('.doc') || urlLower.includes('.docx') || urlLower.includes('word')) return 'DOC';
    if (urlLower.includes('.ppt') || urlLower.includes('.pptx') || urlLower.includes('powerpoint')) return 'PPT';
    if (urlLower.includes('.xls') || urlLower.includes('.xlsx') || urlLower.includes('excel')) return 'XLS';
    if (urlLower.includes('.jpg') || urlLower.includes('.jpeg') || urlLower.includes('.png') || urlLower.includes('.gif') || urlLower.includes('image')) return 'IMAGE';
    if (urlLower.includes('.mp4') || urlLower.includes('.avi') || urlLower.includes('.mov') || urlLower.includes('video')) return 'VIDEO';
    if (mediaStyle.includes('동영상') || mediaStyle.includes('영상')) return 'VIDEO';
    if (mediaStyle.includes('책자') || mediaStyle.includes('OPS') || mediaStyle.includes('리플릿')) return 'PDF';
    if (mediaStyle.includes('교안') || mediaStyle.includes('PPT')) return 'PPT';
    if (mediaStyle.includes('포스터') || mediaStyle.includes('이미지')) return 'IMAGE';
    return 'UNKNOWN';
  }

  extractKoshaThumbnailUrls(htmlContent) {
    const urls = [];
    try {
      log.debug('HTML 파싱 시작', { 
        htmlLength: htmlContent.length,
        hasViewThumbnail: htmlContent.includes('viewThumbnail'),
        hasAtcflNo: htmlContent.includes('atcflNo'),
        hasBackgroundImage: htmlContent.includes('background-image'),
        hasQuot: htmlContent.includes('&quot;')
      });
      const htmlSample = htmlContent.substring(0, 1000);
      log.debug('HTML 샘플', { htmlSample });
      const directPattern = /background-image:\s*url\(&quot;\/api\/portal24\/bizV\/p\/VCPDG01007\/viewThumbnail\?atcflNo=([^&]*)&quot;\)/g;
      const simplePattern = /viewThumbnail\?atcflNo=([^&]+)/g;
      let directMatch;
      while ((directMatch = directPattern.exec(htmlContent)) !== null) {
        const fileId = directMatch[1];
        const fullUrl = `https://portal.kosha.or.kr/api/portal24/bizV/p/VCPDG01007/viewThumbnail?atcflNo=${fileId}`;
        urls.push({ thumbnailUrl: fullUrl, fileId });
        log.debug('직접 패턴으로 썸네일 URL 발견', { fileId, fullUrl });
      }
      let simpleMatch;
      while ((simpleMatch = simplePattern.exec(htmlContent)) !== null) {
        const fileId = simpleMatch[1];
        const fullUrl = `https://portal.kosha.or.kr/api/portal24/bizV/p/VCPDG01007/viewThumbnail?atcflNo=${fileId}`;
        urls.push({ thumbnailUrl: fullUrl, fileId });
        log.debug('간단한 패턴으로 썸네일 URL 발견', { fileId, fullUrl });
      }

      const thumbnailPatterns = [
        /\/api\/portal24\/bizV\/p\/VCPDG01007\/viewThumbnail\?atcflNo=([^"'\s&]+)/g,
        /viewThumbnail\?atcflNo=([^"'\s&]+)/g,
        /background-image:\s*url\(&quot;([^&]*viewThumbnail[^&]*)&quot;\)/g,
        /background-image:\s*url\(&quot;\/api\/portal24\/bizV\/p\/VCPDG01007\/viewThumbnail\?atcflNo=([^&]*)&quot;\)/g,
        /background-image:\s*url\(["']?([^"'\s]*viewThumbnail[^"'\s]*)["']?\)/g,
        /src=["']([^"'\s]*viewThumbnail[^"'\s]*)["']/g,
        /data-src=["']([^"'\s]*viewThumbnail[^"'\s]*)["']/g,
        /href=["']([^"'\s]*viewThumbnail[^"'\s]*)["']/g,
        /onclick=["']([^"'\s]*viewThumbnail[^"'\s]*)["']/g,
        /["']([^"'\s]*viewThumbnail[^"'\s]*)["']/g
      ];

      for (const pattern of thumbnailPatterns) {
        let match;
        while ((match = pattern.exec(htmlContent)) !== null) {
          let thumbnailUrl = match[0];
          thumbnailUrl = thumbnailUrl.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
          if (thumbnailUrl.includes('background-image')) {
            const urlMatch = thumbnailUrl.match(/url\(["']?([^"'\s]*)["']?\)/);
            if (urlMatch) {
              thumbnailUrl = urlMatch[1];
              thumbnailUrl = thumbnailUrl.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            }
          }
          if (thumbnailUrl.includes('src=')) {
            const urlMatch = thumbnailUrl.match(/src=["']([^"'\s]*)["']/);
            if (urlMatch) {
              thumbnailUrl = urlMatch[1];
            }
          }
          if (thumbnailUrl.includes('data-src=')) {
            const urlMatch = thumbnailUrl.match(/data-src=["']([^"'\s]*)["']/);
            if (urlMatch) {
              thumbnailUrl = urlMatch[1];
            }
          }
          if (thumbnailUrl.includes('viewThumbnail')) {
            let fullUrl;
            if (thumbnailUrl.startsWith('http')) {
              fullUrl = thumbnailUrl;
            } else if (thumbnailUrl.startsWith('/viewThumbnail')) {
              fullUrl = `https://portal.kosha.or.kr/api/portal24/bizV/p/VCPDG01007${thumbnailUrl}`;
            } else {
              fullUrl = `https://portal.kosha.or.kr${thumbnailUrl}`;
            }
            const fileIdMatch = thumbnailUrl.match(/atcflNo=([^"'\s&]+)/);
            const fileId = fileIdMatch ? fileIdMatch[1] : `thumb_${urls.length + 1}`;
            urls.push({ thumbnailUrl: fullUrl, fileId });
          }
        }
      }

      const uniqueUrls = [];
      const seenUrls = new Set();
      for (const urlObj of urls) {
        if (!seenUrls.has(urlObj.thumbnailUrl)) {
          seenUrls.add(urlObj.thumbnailUrl);
          uniqueUrls.push(urlObj);
        }
      }
      urls.length = 0;
      urls.push(...uniqueUrls);

      log.info('썸네일 URL 추출 완료', { 
        total_found: urls.length,
        urls: urls.map(u => ({ url: u.thumbnailUrl, fileId: u.fileId }))
      });
      return urls;
    } catch (error) {
      log.error('HTML에서 썸네일 URL 추출 실패', { error: error.message });
      return [];
    }
  }

  async downloadKoshaThumbnailsFromUrls(thumbnailUrls) {
    const downloadedFiles = [];
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.ensureDir(downloadDir);

    for (let i = 0; i < thumbnailUrls.length; i++) {
      const { thumbnailUrl, fileId } = thumbnailUrls[i];
      let success = false;
      let lastError = null;
      for (let retry = 0; retry < 3 && !success; retry++) {
        try {
          log.info('KOSHA 썸네일 다운로드 시작', { url: thumbnailUrl, fileId, attempt: retry + 1 });
          const response = await fetch(thumbnailUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
              'Referer': 'https://portal.kosha.or.kr/',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            timeout: 10000
          });
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            if (buffer.byteLength === 0) {
              log.warn('빈 파일 다운로드됨', { url: thumbnailUrl, fileId });
              if (retry < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
                continue;
              }
            }
            const filename = `kosha_thumbnail_${fileId.replace(/[^a-zA-Z0-9]/g, '_')}.jpg`;
            const filepath = path.join(downloadDir, filename);
            await fs.writeFile(filepath, Buffer.from(buffer));
            downloadedFiles.push({
              title: `KOSHA 썸네일 ${i + 1}`,
              url: thumbnailUrl,
              file_type: 'JPG',
              downloaded_path: filepath,
              filename: filename,
              file_size: buffer.byteLength,
              download_status: 'success',
              method: 'http',
              file_id: fileId,
              attempts: retry + 1
            });
            log.info('KOSHA 썸네일 다운로드 성공', { filename, size: buffer.byteLength, fileId, attempts: retry + 1 });
            success = true;
          } else {
            log.warn('KOSHA 썸네일 다운로드 실패', { url: thumbnailUrl, status: response.status, fileId, attempt: retry + 1 });
            lastError = `HTTP ${response.status}`;
            if (response.status >= 400 && response.status < 500) {
              break;
            }
            if (retry < 2) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
            }
          }
        } catch (error) {
          log.error('KOSHA 썸네일 다운로드 오류', { url: thumbnailUrl, error: error.message, fileId, attempt: retry + 1 });
          lastError = error.message;
          if (retry < 2) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (retry + 1)));
          }
        }
      }
      if (!success) {
        downloadedFiles.push({
          title: `KOSHA 썸네일 ${i + 1}`,
          url: thumbnailUrl,
          file_type: 'JPG',
          download_status: 'failed',
          error: lastError || 'Unknown error',
          method: 'http',
          file_id: fileId,
          attempts: 3
        });
      }
    }
    return downloadedFiles;
  }

  async downloadKoshaThumbnails(args) {
    let browser = null;
    const startTime = Date.now();
    try {
      const { url, max_downloads = 2 } = args;
      if (!url) {
        throw new Error('URL이 필요합니다.');
      }
      if (!url.includes('portal.kosha.or.kr')) {
        throw new Error('KOSHA 포털 URL이 아닙니다.');
      }
      log.info('KOSHA 포털 URL에서 썸네일 추출 시작', { url, max_downloads, timestamp: new Date().toISOString() });

      let puppeteer;
      try {
        puppeteer = await import('puppeteer');
      } catch (importError) {
        log.error('Puppeteer import 실패', { error: importError.message });
        throw new Error('Puppeteer를 사용할 수 없습니다. 브라우저 환경을 확인해주세요.');
      }

      log.info('Puppeteer 브라우저 실행 시작', { timestamp: new Date().toISOString(), timeout: 15000 });
      try {
        browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--disable-images',
            '--disable-javascript',
            '--disable-plugins',
            '--disable-extensions',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-css',
            '--disable-fonts',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--memory-pressure-off',
            '--max_old_space_size=4096'
          ],
          timeout: 15000
        });
        log.info('Puppeteer 브라우저 실행 성공', { timestamp: new Date().toISOString(), duration: Date.now() - startTime });
      } catch (launchError) {
        log.error('Puppeteer 브라우저 실행 실패', { error: launchError.message, errorType: launchError.name, duration: Date.now() - startTime, timestamp: new Date().toISOString() });
        throw new Error('브라우저를 실행할 수 없습니다. Docker 환경에서는 추가 설정이 필요할 수 있습니다.');
      }

      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      log.info('페이지 로드 시작', { url, timestamp: new Date().toISOString(), timeout: 15000 });

      const thumbnailRequests = [];
      page.on('request', (request) => {
        const requestUrl = request.url();
        if (requestUrl.includes('viewThumbnail')) {
          thumbnailRequests.push({ url: requestUrl, method: request.method(), headers: request.headers() });
          log.debug('viewThumbnail API 요청 발견', { url: requestUrl });
        }
      });

      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(resolve => setTimeout(resolve, 3000));
        log.info('페이지 로드 성공', { url, timestamp: new Date().toISOString(), duration: Date.now() - startTime, thumbnailRequestsFound: thumbnailRequests.length });
      } catch (gotoError) {
        log.error('페이지 로드 실패', { error: gotoError.message, errorType: gotoError.name, url, duration: Date.now() - startTime, timestamp: new Date().toISOString() });
        throw new Error(`페이지를 로드할 수 없습니다: ${gotoError.message}`);
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
      let htmlContent;
      try {
        htmlContent = await page.content();
        log.info('페이지 로드 완료', { url, contentLength: htmlContent.length });
      } catch (contentError) {
        log.error('페이지 내용 가져오기 실패', { error: contentError.message });
        throw new Error(`페이지 내용을 가져올 수 없습니다: ${contentError.message}`);
      }

      this.currentUrl = url;
      let thumbnailUrls = [];
      if (thumbnailRequests.length > 0) {
        thumbnailUrls = thumbnailRequests.map(req => ({
          thumbnailUrl: req.url,
          fileId: req.url.match(/atcflNo=([^&]+)/)?.[1] || 'unknown'
        }));
        log.info('네트워크 요청에서 썸네일 URL 발견', { count: thumbnailUrls.length, urls: thumbnailUrls.map(u => u.thumbnailUrl) });
      } else {
        log.warn('네트워크 요청에서 썸네일을 찾지 못했습니다. HTML 파싱을 시도합니다.');
        thumbnailUrls = this.extractKoshaThumbnailUrls(htmlContent);
      }

      if (thumbnailUrls.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'HTML에서 썸네일 URL을 찾을 수 없습니다.',
                url: url,
                downloaded_files: [],
                download_summary: { total_requested: 0, total_downloaded: 0, failed_downloads: 0 }
              }, null, 2)
            }
          ]
        };
      }

      const urlsToDownload = thumbnailUrls.slice(0, max_downloads);
      const downloadedFiles = await this.downloadKoshaThumbnailsFromUrls(urlsToDownload);
      const successCount = downloadedFiles.filter(f => f.download_status === 'success').length;
      const result = {
        success: true,
        message: `${urlsToDownload.length}개 썸네일 중 ${successCount}개 다운로드 완료`,
        url: url,
        downloaded_files: downloadedFiles,
        download_summary: {
          total_requested: urlsToDownload.length,
          total_downloaded: successCount,
          failed_downloads: downloadedFiles.length - successCount
        }
      };
      log.info('KOSHA 썸네일 다운로드 완료', { url: url, total_downloaded: successCount, total_requested: urlsToDownload.length });
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    } catch (error) {
      log.error('KOSHA 썸네일 다운로드 실패', { error: error.message, errorType: error.name, url: args.url, stack: error.stack });
      let userMessage = error.message;
      if (error.message.includes('Puppeteer')) {
        userMessage = '브라우저 환경 문제로 다운로드할 수 없습니다. 서버 관리자에게 문의하세요.';
      } else if (error.message.includes('페이지를 로드할 수 없습니다')) {
        userMessage = 'KOSHA 포털 페이지에 접근할 수 없습니다. URL을 확인하거나 나중에 다시 시도하세요.';
      } else if (error.message.includes('브라우저를 실행할 수 없습니다')) {
        userMessage = '브라우저를 실행할 수 없습니다. Docker 환경에서는 추가 설정이 필요할 수 있습니다.';
      }
      const errorResult = {
        success: false,
        error: userMessage,
        error_type: error.name || 'Error',
        technical_error: error.message,
        url: args.url,
        downloaded_files: [],
        download_summary: { total_requested: 0, total_downloaded: 0, failed_downloads: 0 }
      };
      return { content: [{ type: "text", text: JSON.stringify(errorResult, null, 2) }] };
    } finally {
      if (browser) {
        try {
          await browser.close();
          log.info('브라우저 정리 완료');
        } catch (closeError) {
          log.warn('브라우저 종료 중 오류', { error: closeError.message });
        }
      }
    }
  }

  async downloadFilesSimple(downloadList) {
    const downloadedFiles = [];
    const downloadDir = path.join(__dirname, 'downloads');
    await fs.ensureDir(downloadDir);
    log.info('간단한 HTTP 다운로드 시작', { downloadDir, fileCount: downloadList.length });
    for (const fileInfo of downloadList) {
      let { url, title, file_type } = fileInfo;
      try {
        log.debug('파일 다운로드 시작', { title, url, file_type });
        if (url.includes('viewThumbnail')) {
          const downloadUrl = url.replace('viewThumbnail', 'download');
          log.info('KOSHA 포털 URL 패턴 변환', { original: url, converted: downloadUrl });
          url = downloadUrl;
        }
        if (url.includes('/api/portal24/bizV/p/VCPDG01007/download')) {
          log.info('KOSHA 포털 다운로드 URL 감지', { url });
        }
        const response = await fetch(url, { method: 'GET', headers: { 'User-Agent': 'MCP-KOSHA-Downloader/1.0.0', 'Accept': '*/*' }, timeout: 30000 });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const safeTitle = title.replace(/[^a-zA-Z0-9가-힣\s-_]/g, '').trim();
        const extension = this.getFileExtension(file_type);
        const filename = `${safeTitle}.${extension}`;
        const filePath = path.join(downloadDir, filename);
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        await fs.writeFile(filePath, buffer);
        const stats = await fs.stat(filePath);
        downloadedFiles.push({ title, url, file_type, downloaded_path: filePath, filename, file_size: stats.size, download_status: 'success' });
        log.info('파일 다운로드 완료', { filename, size: stats.size });
      } catch (error) {
        log.errorWithContext(error, { operation: 'downloadFileSimple', title: title, url: url });
        downloadedFiles.push({ title, url, file_type, download_status: 'failed', error: error.message });
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    log.info('간단한 HTTP 다운로드 완료', { totalFiles: downloadList.length, successCount: downloadedFiles.filter(f => f.download_status === 'success').length });
    return downloadedFiles;
  }

  async downloadWithSelenium(pageUrl, downloadDir, filename) {
    let driver;
    try {
      log.info('Selenium으로 KOSHA 페이지 다운로드 시작', { pageUrl, downloadDir, filename });
      const options = new ChromeOptions();
      options.addArguments('--no-sandbox');
      options.addArguments('--disable-dev-shm-usage');
      options.addArguments('--disable-gpu');
      options.addArguments('--window-size=1920,1080');
      options.addArguments('--disable-web-security');
      options.addArguments('--allow-running-insecure-content');
      const prefs = {
        'download.default_directory': downloadDir,
        'download.prompt_for_download': false,
        'download.directory_upgrade': true,
        'safebrowsing.enabled': true
      };
      options.setUserPreferences(prefs);
      driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
      await driver.get(pageUrl);
      await driver.wait(until.titleContains(''), 10000);
      await driver.sleep(3000);
      const downloadSelectors = [
        'button.download','button[class*="download"]','a[href*=".jpg"]','a[href*=".jpeg"]','a[href*=".png"]','a[href*=".gif"]','a[href*=".bmp"]','a[href*=".webp"]','a[href*=".svg"]','button[onclick*=".jpg"]','button[onclick*=".jpeg"]','button[onclick*=".png"]','button[onclick*=".gif"]','button[onclick*=".bmp"]','button[onclick*=".webp"]','button[onclick*=".svg"]','button:contains("이미지")','a:contains("이미지")','button:contains("JPG")','a:contains("JPG")','button:contains("PNG")','a:contains("PNG")','a[href*="download"]','button[onclick*="download"]','button:contains("다운로드")','a:contains("다운로드")','button.downAll','button[class*="downAll"]'
      ];
      let downloadLinks = [];
      let foundSelector = '';
      for (const selector of downloadSelectors) {
        try {
          const links = await driver.findElements(By.css(selector));
          if (links.length > 0) {
            const imageLinks = [];
            for (const link of links) {
              try {
                const href = await link.getAttribute('href').catch(() => '');
                const onclick = await link.getAttribute('onclick').catch(() => '');
                const text = await link.getText().catch(() => '');
                const isImageFile = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?|$)/i.test(href + onclick + text);
                if (isImageFile) {
                  imageLinks.push(link);
                  log.info('이미지 파일 다운로드 버튼 발견', { selector, href, onclick, text: text.substring(0, 50) });
                }
              } catch (e) {
                imageLinks.push(link);
              }
            }
            if (imageLinks.length > 0) {
              downloadLinks = downloadLinks.concat(imageLinks);
              foundSelector = selector;
              log.info('이미지 다운로드 버튼 발견', { selector, count: imageLinks.length, totalFound: links.length });
            }
          }
        } catch (e) {
          log.debug('선택자 실패', { selector, error: e.message });
        }
      }
      if (downloadLinks.length > 0) {
        log.info('다운로드 링크 발견', { count: downloadLinks.length, foundSelector, totalSelectors: downloadSelectors.length });
        let clicked = false;
        for (let i = 0; i < downloadLinks.length; i++) {
          try {
            const button = downloadLinks[i];
            const isDisplayed = await button.isDisplayed();
            const isEnabled = await button.isEnabled();
            if (isDisplayed && isEnabled) {
              log.info('다운로드 버튼 클릭 시도', { index: i, selector: foundSelector, text: await button.getText().catch(() => 'N/A') });
              await driver.executeScript("arguments[0].scrollIntoView(true);", button);
              await driver.sleep(1000);
              await button.click();
              clicked = true;
              log.info('다운로드 버튼 클릭 성공');
              break;
            }
          } catch (clickError) {
            log.warn('버튼 클릭 실패', { index: i, error: clickError.message });
            continue;
          }
        }
        if (clicked) {
          log.info('다운로드 완료 대기 중...');
          await driver.sleep(15000);
          log.info('다운로드 완료', { pageUrl });
          return true;
        } else {
          log.warn('클릭 가능한 다운로드 버튼을 찾지 못함');
          return false;
        }
      } else {
        log.warn('다운로드 링크를 찾지 못함', { pageUrl, triedSelectors: downloadSelectors.length });
        try {
          const pageSource = await driver.getPageSource();
          const sourcePreview = pageSource.substring(0, 2000);
          log.debug('페이지 소스 미리보기', { sourcePreview });
        } catch (e) {
          log.debug('페이지 소스 읽기 실패', { error: e.message });
        }
        return false;
      }
    } catch (error) {
      log.errorWithContext(error, { operation: 'downloadWithSelenium', pageUrl });
      throw error;
    } finally {
      if (driver) {
        await driver.quit();
      }
    }
  }

  getFileExtension(fileType) {
    const extensions = { 'PDF': 'pdf', 'DOC': 'doc', 'PPT': 'ppt', 'XLS': 'xls', 'IMAGE': 'jpg', 'VIDEO': 'mp4', 'UNKNOWN': 'bin' };
    return extensions[fileType] || 'bin';
  }
}

export { KoshaTools };


