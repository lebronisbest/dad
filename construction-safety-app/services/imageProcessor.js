const sharp = require('sharp');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class ImageProcessor {
    constructor() {
        this.uploadDir = path.join(__dirname, '../uploads');
        this.processedDir = path.join(__dirname, '../processed');
        this.thumbnailsDir = path.join(__dirname, '../thumbnails');
        this.maxWidth = 2000;
        this.maxHeight = 2000;
        this.quality = 85;
        this.thumbnailSize = 300;
        
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.uploadDir, { recursive: true });
            await fs.mkdir(this.processedDir, { recursive: true });
            await fs.mkdir(this.thumbnailsDir, { recursive: true });
        } catch (error) {
            console.error('디렉토리 생성 오류:', error);
        }
    }

    // 파일 해시 생성
    generateFileHash(buffer) {
        return crypto.createHash('sha256').update(buffer).digest('hex');
    }

    // 파일 확장자 검증
    validateFileExtension(filename) {
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
        const ext = path.extname(filename).toLowerCase();
        return allowedExtensions.includes(ext);
    }

    // MIME 타입 검증
    validateMimeType(buffer) {
        const signatures = {
            'jpg': [0xFF, 0xD8, 0xFF],
            'png': [0x89, 0x50, 0x4E, 0x47],
            'gif': [0x47, 0x49, 0x46],
            'bmp': [0x42, 0x4D],
            'webp': [0x52, 0x49, 0x46, 0x46]
        };

        for (const [format, signature] of Object.entries(signatures)) {
            if (signature.every((byte, index) => buffer[index] === byte)) {
                return format;
            }
        }
        return null;
    }

    // 이미지 처리 및 최적화
    async processImage(buffer, originalFilename) {
        try {
            // 파일 해시 생성
            const fileHash = this.generateFileHash(buffer);
            
            // 이미 처리된 파일이 있는지 확인
            const existingFile = await this.findExistingFile(fileHash);
            if (existingFile) {
                console.log('이미 처리된 파일 발견:', existingFile);
                return {
                    success: true,
                    filename: existingFile.filename,
                    thumbnail: existingFile.thumbnail,
                    hash: fileHash,
                    reused: true
                };
            }

            // MIME 타입 검증
            const mimeType = this.validateMimeType(buffer);
            if (!mimeType) {
                throw new Error('지원하지 않는 이미지 형식입니다');
            }

            // Sharp로 이미지 처리
            const image = sharp(buffer);
            
            // 메타데이터 추출
            const metadata = await image.metadata();
            
            // 이미지 리사이즈 (비율 유지)
            const resizedImage = await image
                .resize(this.maxWidth, this.maxHeight, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .rotate() // EXIF 회전 정보 적용
                .jpeg({ quality: this.quality, progressive: true })
                .toBuffer();

            // 썸네일 생성
            const thumbnail = await sharp(buffer)
                .resize(this.thumbnailSize, this.thumbnailSize, {
                    fit: 'cover',
                    position: 'center'
                })
                .jpeg({ quality: 80 })
                .toBuffer();

            // 파일명 생성
            const timestamp = Date.now();
            const processedFilename = `processed_${timestamp}_${fileHash}.jpg`;
            const thumbnailFilename = `thumb_${timestamp}_${fileHash}.jpg`;

            // 파일 저장
            const processedPath = path.join(this.processedDir, processedFilename);
            const thumbnailPath = path.join(this.thumbnailsDir, thumbnailFilename);

            await fs.writeFile(processedPath, resizedImage);
            await fs.writeFile(thumbnailPath, thumbnail);

            // 메타데이터 저장
            const metadataPath = path.join(this.processedDir, `${fileHash}.json`);
            const imageMetadata = {
                originalFilename,
                processedFilename,
                thumbnailFilename,
                hash: fileHash,
                originalSize: buffer.length,
                processedSize: resizedImage.length,
                thumbnailSize: thumbnail.length,
                dimensions: {
                    original: { width: metadata.width, height: metadata.height },
                    processed: { width: metadata.width, height: metadata.height }
                },
                format: 'jpeg',
                quality: this.quality,
                processedAt: new Date().toISOString()
            };

            await fs.writeFile(metadataPath, JSON.stringify(imageMetadata, null, 2));

            return {
                success: true,
                filename: processedFilename,
                thumbnail: thumbnailFilename,
                hash: fileHash,
                metadata: imageMetadata,
                reused: false
            };

        } catch (error) {
            console.error('이미지 처리 오류:', error);
            throw error;
        }
    }

    // 기존 파일 찾기
    async findExistingFile(hash) {
        try {
            const metadataPath = path.join(this.processedDir, `${hash}.json`);
            const metadata = await fs.readFile(metadataPath, 'utf8');
            const imageData = JSON.parse(metadata);
            
            // 파일 존재 여부 확인
            const processedPath = path.join(this.processedDir, imageData.processedFilename);
            const thumbnailPath = path.join(this.thumbnailsDir, imageData.thumbnailFilename);
            
            const [processedExists, thumbnailExists] = await Promise.all([
                fs.access(processedPath).then(() => true).catch(() => false),
                fs.access(thumbnailPath).then(() => true).catch(() => false)
            ]);

            if (processedExists && thumbnailExists) {
                return {
                    filename: imageData.processedFilename,
                    thumbnail: imageData.thumbnailFilename,
                    metadata: imageData
                };
            }
        } catch (error) {
            // 파일이 없거나 읽을 수 없는 경우
        }
        return null;
    }

    // 이미지 정보 조회
    async getImageInfo(filename) {
        try {
            const imagePath = path.join(this.processedDir, filename);
            const image = sharp(imagePath);
            const metadata = await image.metadata();
            
            return {
                filename,
                width: metadata.width,
                height: metadata.height,
                format: metadata.format,
                size: metadata.size,
                hasProfile: metadata.hasProfile,
                hasAlpha: metadata.hasAlpha
            };
        } catch (error) {
            console.error('이미지 정보 조회 오류:', error);
            throw error;
        }
    }

    // 이미지 삭제
    async deleteImage(filename) {
        try {
            const processedPath = path.join(this.processedDir, filename);
            const thumbnailPath = path.join(this.thumbnailsDir, filename.replace('processed_', 'thumb_'));
            
            await Promise.all([
                fs.unlink(processedPath),
                fs.unlink(thumbnailPath)
            ]);

            return { success: true };
        } catch (error) {
            console.error('이미지 삭제 오류:', error);
            throw error;
        }
    }

    // 배치 처리
    async processBatch(files) {
        const results = [];
        
        for (const file of files) {
            try {
                const result = await this.processImage(file.buffer, file.originalname);
                results.push({ ...result, originalname: file.originalname });
            } catch (error) {
                results.push({
                    success: false,
                    originalname: file.originalname,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    // 품질 설정
    setQuality(quality) {
        if (quality >= 60 && quality <= 100) {
            this.quality = quality;
        }
    }

    // 크기 설정
    setMaxDimensions(width, height) {
        if (width > 0 && height > 0) {
            this.maxWidth = width;
            this.maxHeight = height;
        }
    }
}

module.exports = ImageProcessor;
