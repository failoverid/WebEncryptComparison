# Web Encrypt Comparison

A modern, responsive, client-side benchmarking dashboard for comparing symmetric encryption algorithms (AES, Twofish, Camellia) and modes (CBC, CFB, OFB, CTR) on files in the browser.

## Features
- Pure JavaScript/TypeScript implementation (no WebCrypto, no native bindings)
- Compare AES, Camellia, and Twofish (all in JS)
- Modes: CBC, CFB, OFB, CTR (where supported)
- File upload and benchmarking (multiple runs)
- Performance chart and statistics (min, max, avg, std dev)
- Export results to XLSX
- Modern UI with shadcn/ui, dark mode, and responsive layout
- Dockerized for easy deployment

## Usage
1. Upload a file
2. Select algorithm, mode, and number of runs
3. Click **Encrypt & Measure**
4. View performance chart and stats
5. Export results as XLSX if needed

> **Note:** All cryptography is for educational/demo purposes only. Do not use for real security.

## Development
- Next.js + TypeScript + shadcn/ui
- All crypto logic runs in the browser
- No server-side code required

## License
MIT

## Contributors

- Alfansyah Putra Raja Dinata
- Alfaiz Arifin Setia Budi
- Muhammad Althafino
- Muhammad Muflih Affandi

---

[GitHub Repository](https://github.com/failoverid/WebEncryptComparison)
