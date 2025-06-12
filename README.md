
# Symmetric Encryption Performance Comparator

This is a web-based application built with Next.js, TypeScript, and Tailwind CSS. It allows users to test and compare the performance of AES, Twofish, and Camellia symmetric encryption algorithms in various modes (CBC, CFB, OFB, CTR) on uploaded files (text, image, PDF). All encryption is performed client-side. The app provides performance metrics and visualizations, and is fully containerized for local use.

## Features
- Upload files (text, image, PDF)
- Select encryption algorithm and mode
- View encryption results: file name, size, type, algorithm, mode, encryption time, CPU/memory usage (if feasible), ciphertext snippet
- Performance visualization (Chart.js or Recharts)
- Responsive UI
- 100% client-side (no backend)
- Dockerized for easy local deployment

## Getting Started

### Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Docker
1. Build the Docker image:
   ```bash
   docker build -t encryption-comparator .
   ```
2. Run the container:
   ```bash
   docker run -p 3000:3000 encryption-comparator
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License
MIT
