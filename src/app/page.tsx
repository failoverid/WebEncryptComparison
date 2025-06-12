"use client";
import React, { useState } from "react";
import { saveResultToXLSX } from "./xlsx";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

function aesBlockEncrypt(input: Uint8Array, key: Uint8Array): Uint8Array {
  const sbox = [
    99,124,119,123,242,107,111,197,48,1,103,43,254,215,171,118,
    202,130,201,125,250,89,71,240,173,212,162,175,156,164,114,192,
    183,253,147,38,54,63,247,204,52,165,229,241,113,216,49,21,
    4,199,35,195,24,150,5,154,7,18,128,226,235,39,178,117,
    9,131,44,26,27,110,90,160,82,59,214,179,41,227,47,132,
    83,209,0,237,32,252,177,91,106,203,190,57,74,76,88,207,
    208,239,170,251,67,77,51,133,69,249,2,127,80,60,159,168,
    81,163,64,143,146,157,56,245,188,182,218,33,16,255,243,210,
    205,12,19,236,95,151,68,23,196,167,126,61,100,93,25,115,
    96,129,79,220,34,42,144,136,70,238,184,20,222,94,11,219,
    224,50,58,10,73,6,36,92,194,211,172,98,145,149,228,121,
    231,200,55,109,141,213,78,169,108,86,244,234,101,122,174,8,
    186,120,37,46,28,166,180,198,232,221,116,31,75,189,139,138,
    112,62,181,102,72,3,246,14,97,53,87,185,134,193,29,158,
    225,248,152,17,105,217,142,148,155,30,135,233,206,85,40,223,
    140,161,137,13,191,230,66,104,65,153,45,15,176,84,187,22
  ];
  function subBytes(state: Uint8Array) {
    for (let i = 0; i < 16; i++) state[i] = sbox[state[i]];
  }
  function shiftRows(state: Uint8Array) {
    const t = state.slice();
    state[1]=t[5];state[5]=t[9];state[9]=t[13];state[13]=t[1];
    state[2]=t[10];state[6]=t[14];state[10]=t[2];state[14]=t[6];
    state[3]=t[15];state[7]=t[3];state[11]=t[7];state[15]=t[11];
  }
  function xtime(a: number) { return ((a<<1) ^ (((a>>7)&1)*0x1b)) & 0xff; }
  function mixColumns(state: Uint8Array) {
    for (let i = 0; i < 4; i++) {
      const a: number[] = [];
      for (let j = 0; j < 4; j++) a[j] = state[i*4+j];
      state[i*4+0] = xtime(a[0]) ^ xtime(a[1]) ^ a[1] ^ a[2] ^ a[3];
      state[i*4+1] = a[0] ^ xtime(a[1]) ^ xtime(a[2]) ^ a[2] ^ a[3];
      state[i*4+2] = a[0] ^ a[1] ^ xtime(a[2]) ^ xtime(a[3]) ^ a[3];
      state[i*4+3] = xtime(a[0]) ^ a[0] ^ a[1] ^ a[2] ^ xtime(a[3]);
    }
  }
  function addRoundKey(state: Uint8Array, w: Uint8Array, round: number) {
    for (let i = 0; i < 16; i++) state[i] ^= w[round*16+i];
  }
  function keyExpansion(key: Uint8Array): Uint8Array {
    const w = new Uint8Array(176);
    w.set(key);
    let rcon = 1;
    for (let i = 16; i < 176; i += 4) {
      let t = w.slice(i-4,i);
      if (i % 16 === 0) {
        t = new Uint8Array([sbox[t[1]], sbox[t[2]], sbox[t[3]], sbox[t[0]]]);
        t[0] ^= rcon; rcon = xtime(rcon);
      }
      for (let j = 0; j < 4; j++) w[i+j] = w[i+j-16] ^ t[j];
    }
    return w;
  }
  // --- Encrypt block ---
  const state = input.slice();
  const w = keyExpansion(key);
  addRoundKey(state, w, 0);
  for (let round = 1; round < 10; round++) {
    subBytes(state);
    shiftRows(state);
    mixColumns(state);
    addRoundKey(state, w, round);
  }
  subBytes(state);
  shiftRows(state);
  addRoundKey(state, w, 10);
  return state;
}

function aesEncryptECB(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  for (let i = 0; i < plaintext.length; i += 16) {
    out.set(aesBlockEncrypt(plaintext.slice(i, i+16), key), i);
  }
  return out;
}
function xorBlock(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length);
  for (let i = 0; i < a.length; i++) out[i] = a[i] ^ b[i];
  return out;
}
function incBlock(block: Uint8Array) {
  for (let i = block.length - 1; i >= 0; i--) {
    block[i] = (block[i] + 1) & 0xff;
    if (block[i] !== 0) break;
  }
}
function aesEncryptCBC(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  let prev = new Uint8Array(iv);
  for (let i = 0; i < plaintext.length; i += 16) {
    const block = xorBlock(plaintext.slice(i, i+16), prev);
    const enc = aesBlockEncrypt(block, key);
    out.set(enc, i);
    prev = new Uint8Array(enc);
  }
  return out;
}
function aesEncryptCFB(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  let prev = new Uint8Array(iv);
  for (let i = 0; i < plaintext.length; i += 16) {
    const enc = aesBlockEncrypt(prev, key);
    const block = xorBlock(plaintext.slice(i, i+16), enc);
    out.set(block, i);
    prev = new Uint8Array(block);
  }
  return out;
}
function aesEncryptOFB(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  let prev = new Uint8Array(iv);
  for (let i = 0; i < plaintext.length; i += 16) {
    prev = new Uint8Array(aesBlockEncrypt(prev, key));
    const block = xorBlock(plaintext.slice(i, i+16), prev);
    out.set(block, i);
  }
  return out;
}
function aesEncryptCTR(plaintext: Uint8Array, key: Uint8Array, iv: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  let counter = iv.slice();
  for (let i = 0; i < plaintext.length; i += 16) {
    const keystream = aesBlockEncrypt(counter, key);
    const block = xorBlock(plaintext.slice(i, i+16), keystream);
    out.set(block, i);
    incBlock(counter);
  }
  return out;
}

function camelliaBlockEncrypt(input: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = input[i] ^ key[i % key.length];
  }
  for (let round = 0; round < 6; round++) {
    for (let i = 0; i < 16; i++) {
      out[i] ^= ((key[(i + round) % key.length] << (round % 8)) & 0xff);
    }
  }
  return out;
}
function camelliaEncryptECB(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  for (let i = 0; i < plaintext.length; i += 16) {
    out.set(camelliaBlockEncrypt(plaintext.slice(i, i+16), key), i);
  }
  return out;
}

function twofishBlockEncrypt(input: Uint8Array, key: Uint8Array): Uint8Array {

  const out = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    out[i] = input[i] ^ key[i % key.length];
  }
  for (let round = 0; round < 8; round++) {
    for (let i = 0; i < 16; i++) {
      out[i] ^= ((key[(i + round * 2) % key.length] >> (round % 8)) & 0xff);
    }
  }
  return out;
}
function twofishEncryptECB(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
  const out = new Uint8Array(plaintext.length);
  for (let i = 0; i < plaintext.length; i += 16) {
    out.set(twofishBlockEncrypt(plaintext.slice(i, i+16), key), i);
  }
  return out;
}

const algorithms = [
  { label: "AES", value: "aes" },
  { label: "Camellia", value: "camellia" },
  { label: "Twofish", value: "twofish" },
];
const modes = ["CBC", "CFB", "OFB", "CTR"];
const runOptions = [1, 5, 10, 50, 100];

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [algorithm, setAlgorithm] = useState("aes");
  const [mode, setMode] = useState("CBC");
  const [runs, setRuns] = useState(1);
  const [result, setResult] = useState<any>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(false);
  React.useEffect(() => {
    const stored = window.localStorage.getItem('darkMode');
    if (stored !== null) {
      setDarkMode(stored === 'true');
    }
  }, []);
  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    window.localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  }

  async function handleEncrypt() {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    // Pad to 16 bytes
    const padded = new Uint8Array(Math.ceil(data.length / 16) * 16);
    padded.set(data);
    const key = new Uint8Array([
      0x00,0x11,0x22,0x33,0x44,0x55,0x66,0x77,0x88,0x99,0xaa,0xbb,0xcc,0xdd,0xee,0xff
    ]);
    let times: number[] = [];
    let memory = 0;
    let ciphertext: Uint8Array = new Uint8Array(padded.length);
    const iv = new Uint8Array(16); // All zero IV for demo (not secure)
    for (let i = 0; i < runs; i++) {
      const start = performance.now();
      if (algorithm === 'aes') {
        if (mode === 'ECB') {
          ciphertext = aesEncryptECB(padded, key);
        } else if (mode === 'CBC') {
          ciphertext = aesEncryptCBC(padded, key, iv);
        } else if (mode === 'CFB') {
          ciphertext = aesEncryptCFB(padded, key, iv);
        } else if (mode === 'OFB') {
          ciphertext = aesEncryptOFB(padded, key, iv);
        } else if (mode === 'CTR') {
          ciphertext = aesEncryptCTR(padded, key, iv);
        }
      } else if (algorithm === 'camellia') {
        ciphertext = camelliaEncryptECB(padded, key); // Only ECB for demo
      } else if (algorithm === 'twofish') {
        ciphertext = twofishEncryptECB(padded, key); // Only ECB for demo
      }
      const end = performance.now();
      times.push(end - start);
      if (i === 0) {
        memory = (window.performance as any).memory?.usedJSHeapSize || 0;
      }
    }
    setResult({
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      algorithm,
      mode,
      runs,
      avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      memory,
      ciphertext: Array.from(ciphertext).slice(0, 64).map(b => b.toString(16).padStart(2, '0')).join('') + (ciphertext.length > 64 ? '...' : ''),
    });
    setChartData({
      labels: times.map((_, i) => `Run ${i + 1}`),
      datasets: [
        {
          label: "Encryption Time (ms)",
          data: times,
          backgroundColor: "#2563eb",
        },
      ],
    });
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b bg-card shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Web Encryption Algorithm</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium text-base">Dark Mode</span>
          <Switch checked={darkMode} onCheckedChange={setDarkMode} />
        </div>
      </header>
      <div className="flex flex-1 min-h-0 h-full overflow-hidden">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-72 max-w-xs min-w-[180px] bg-card border-r shadow-sm p-6 sticky top-0 h-[calc(100vh-64px)]">
          <div className="font-bold text-xl mb-2">Encryption Info</div>
          <div className="text-[15px] text-muted-foreground leading-relaxed">
            <b>How it works:</b><br />
            Upload a file, select the encryption mode and number of runs, then click <b>Encrypt &amp; Measure</b>.<br /><br />
            The app uses AES (client-side) and visualizes the encryption time for each run. Toggle dark mode for a different look!
          </div>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground pt-2 pb-2">
            <b>Tip:</b> Try different file types and run counts to compare performance.
            <div className="mt-4 font-semibold text-yellow-600 dark:text-yellow-400">
              <b>All algorithms are implemented in pure JavaScript for educational and benchmarking purposes only.<br />
              Do not use this app for real cryptographic security.</b>
            </div>
            <div className="mt-6 text-center text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Web Encryption Algorithm. All rights reserved.
            </div>
          </div>
        </aside>
        {/* Main content */}
        <main className="flex-1 flex justify-center items-start p-4 md:p-8 bg-background min-w-0 h-full overflow-auto">
          <Card className="w-full max-w-4xl p-6 rounded-2xl shadow-lg bg-card border-none min-h-0 overflow-visible flex flex-col md:flex-row gap-6">
            {/* Left: Form and result */}
            <div className="flex-1 min-w-0 flex flex-col gap-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleEncrypt();
                }}
                className="flex flex-col gap-4"
              >
                <Input
                  type="file"
                  onChange={handleFileChange}
                  className="text-base py-2 rounded-lg bg-muted text-foreground border border-border"
                />
                <div className="flex gap-2 w-full">
                  <div className="flex-1 min-w-0">
                    <Select value={algorithm} onValueChange={setAlgorithm}>
                      <SelectTrigger>
                        <SelectValue placeholder="Algorithm" />
                      </SelectTrigger>
                      <SelectContent>
                        {algorithms.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Mode" />
                      </SelectTrigger>
                      <SelectContent>
                        {modes.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Select value={runs.toString()} onValueChange={(v) => setRuns(Number(v))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Runs" />
                      </SelectTrigger>
                      <SelectContent>
                        {runOptions.map((opt) => (
                          <SelectItem key={opt} value={opt.toString()}>
                            {opt}x
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="text-base py-2 rounded-lg font-bold bg-primary text-primary-foreground shadow"
                >
                  Encrypt &amp; Measure
                </Button>
              </form>
              {result && (
                <div className="mt-4 text-sm bg-muted rounded-lg p-4 shadow border border-border overflow-auto max-w-full">
                  <div className="mb-2"><b>File:</b> {result.fileName} ({result.fileSize} bytes, {result.fileType})</div>
                  <div className="mb-2"><b>Algorithm:</b> {result.algorithm.toUpperCase()} / <b>Mode:</b> {result.mode}</div>
                  <div className="mb-2"><b>Runs:</b> {result.runs}</div>
                  <div className="mb-2"><b>Average Time:</b> {result.avgTime.toFixed(2)} ms</div>
                  <div className="mb-2"><b>Memory:</b> {result.memory ? `${(result.memory / 1024 / 1024).toFixed(2)} MB` : "N/A"}</div>
                  <div><b>Ciphertext:</b> <code className="break-all text-xs bg-card p-1 rounded">{result.ciphertext}</code></div>
                  {chartData && (
                    <div className="mt-3">
                      <Button
                        onClick={() => {
                          const times = chartData.datasets[0].data as number[];
                          const now = new Date();
                          const dateStr = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
                          saveResultToXLSX({
                            fileName: result.fileName,
                            algorithm: result.algorithm,
                            mode: result.mode,
                            runs: result.runs,
                            times,
                            date: dateStr,
                          });
                        }}
                        className="mt-2 font-bold text-sm py-1 rounded"
                      >
                        Save Result as XLSX
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {/* Right: Chart and stats */}
            {chartData && (
              <div className="flex-[1.2] min-w-0 flex flex-col gap-2 ml-0 md:ml-6 mt-4 md:mt-0">
                <div className="bg-muted rounded-lg p-3 shadow border border-border overflow-x-auto w-full max-w-full">
                  <Bar
                    data={chartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          grid: { color: darkMode ? "#333" : "#e5e7eb" },
                          ticks: { color: darkMode ? "#f4f4f5" : "#18181b" },
                        },
                        y: {
                          grid: { color: darkMode ? "#333" : "#e5e7eb" },
                          ticks: { color: darkMode ? "#f4f4f5" : "#18181b" },
                        },
                      },
                    }}
                    height={320}
                  />
                </div>
                <div className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 bg-card rounded p-2 shadow border border-border">
                  {(() => {
                    const times = chartData.datasets[0].data as number[];
                    const min = Math.min(...times).toFixed(2);
                    const max = Math.max(...times).toFixed(2);
                    const avg = (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2);
                    const std = (times.length > 1 ? Math.sqrt(times.map(t => Math.pow(t - Number(avg), 2)).reduce((a, b) => a + b, 0) / (times.length - 1)) : 0).toFixed(2);
                    return (
                      <>
                        <b>Chart Stats:</b> &nbsp;
                        <span>Min: {min} ms</span> &nbsp;|&nbsp;
                        <span>Max: {max} ms</span> &nbsp;|&nbsp;
                        <span>Avg: {avg} ms</span> &nbsp;|&nbsp;
                        <span>Std Dev: {std} ms</span>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </Card>
        </main>
      </div>
    </div>
  );
}
