import React, { useState, useEffect, useRef, useMemo } from 'react';
import './AppEnhanced.css';
import versionInfo from './version.json';

/* Small inline icons — no external deps */
const LockIcon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/* Per-row copy button with inline "copied" feedback */
function RowCopyBtn({ text, label }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <button
      type="button"
      className={`row-copy ${copied ? 'copied' : ''}`}
      onClick={doCopy}
      title={copied ? 'Copied!' : label}
      aria-label={label}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

const ClockIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

const EyeIcon = ({ open }) => (
  open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3 3.8" />
      <path d="M6.2 6.2A17 17 0 0 0 2 12s3.5 7 10 7a9.3 9.3 0 0 0 3-.5" />
    </svg>
  )
);

/* VSCode-style JSON tree: foldable nodes + depth-colored (rainbow) brackets */
const renderHighlighted = (text, search) => {
  const t = String(text);
  if (!search) return t;
  const lower = t.toLowerCase();
  const q = search.toLowerCase();
  if (!lower.includes(q)) return t;
  const parts = [];
  let i = 0;
  let idx;
  while ((idx = lower.indexOf(q, i)) !== -1) {
    if (idx > i) parts.push(t.slice(i, idx));
    parts.push(<mark className="json-match" key={idx}>{t.slice(idx, idx + q.length)}</mark>);
    i = idx + q.length;
  }
  parts.push(t.slice(i));
  return parts;
};

// Does this key/value (or any descendant) match the search term?
const nodeMatches = (key, value, q) => {
  if (key !== null && key !== undefined && String(key).toLowerCase().includes(q)) return true;
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') {
    const entries = Array.isArray(value) ? value.map(v => [null, v]) : Object.entries(value);
    return entries.some(([k, v]) => nodeMatches(k, v, q));
  }
  return String(value).toLowerCase().includes(q);
};

const JsonPrimitive = ({ value, search }) => {
  if (value === null) return <span className="json-null">null</span>;
  switch (typeof value) {
    case 'string': return <span className="json-str">"{renderHighlighted(value, search)}"</span>;
    case 'number': return <span className="json-num">{renderHighlighted(String(value), search)}</span>;
    case 'boolean': return <span className="json-bool">{String(value)}</span>;
    default: return <span className="json-str">{String(value)}</span>;
  }
};

function JsonNode({ keyName, value, depth, isLast, search, foldSignal, filter }) {
  const [open, setOpen] = useState(true);

  // Fold all / Expand all broadcast from the output toolbar
  useEffect(() => {
    if (!foldSignal || !foldSignal.tick) return;
    if (foldSignal.mode === 'fold') setOpen(depth === 0);
    else if (foldSignal.mode === 'unfold') setOpen(true);
  }, [foldSignal, depth]);

  // Auto-expand while searching so matches stay visible
  useEffect(() => {
    if (search) setOpen(true);
  }, [search]);

  const isObj = value !== null && typeof value === 'object';
  const indent = { paddingLeft: depth * 18 };
  const bracketClass = `json-bracket d${depth % 3}`;

  if (!isObj) {
    return (
      <div className="json-row" style={indent}>
        <span className="json-caret spacer" />
        {keyName !== undefined && (
          <><span className="json-key">"{renderHighlighted(keyName, search)}"</span><span className="json-colon">: </span></>
        )}
        <JsonPrimitive value={value} search={search} />
        {!isLast && <span className="json-comma">,</span>}
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const allEntries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
  // Filter mode: keep only subtrees that contain a match.
  // If this node's own key matches, show its whole subtree for context.
  const q = search ? search.toLowerCase() : '';
  const keySelfMatch = q && keyName !== undefined && String(keyName).toLowerCase().includes(q);
  const entries = (filter && q && !keySelfMatch)
    ? allEntries.filter(([k, v]) => nodeMatches(isArr ? null : k, v, q))
    : allEntries;
  const openCh = isArr ? '[' : '{';
  const closeCh = isArr ? ']' : '}';

  return (
    <>
      <div className="json-row foldable" style={indent}>
        <button
          type="button"
          className={`json-caret ${open ? 'open' : ''}`}
          onClick={() => setOpen(o => !o)}
          title={open ? 'Fold' : 'Unfold'}
        >
          ▸
        </button>
        {keyName !== undefined && (
          <><span className="json-key">"{renderHighlighted(keyName, search)}"</span><span className="json-colon">: </span></>
        )}
        <span className={bracketClass}>{openCh}</span>
        {!open && (
          <>
            <span className="json-ellipsis" onClick={() => setOpen(true)}> ⋯ </span>
            <span className={bracketClass}>{closeCh}</span>
            {!isLast && <span className="json-comma">,</span>}
            <span className="json-count">{entries.length} {isArr ? (entries.length === 1 ? 'item' : 'items') : (entries.length === 1 ? 'key' : 'keys')}</span>
          </>
        )}
      </div>
      {open && (
        <>
          {entries.map(([k, v], i) => (
            <JsonNode
              key={k}
              keyName={isArr ? undefined : k}
              value={v}
              depth={depth + 1}
              isLast={i === entries.length - 1}
              search={search}
              foldSignal={foldSignal}
              filter={filter}
            />
          ))}
          <div className="json-row" style={indent}>
            <span className="json-caret spacer" />
            <span className={bracketClass}>{closeCh}</span>
            {!isLast && <span className="json-comma">,</span>}
          </div>
        </>
      )}
    </>
  );
}

function AppEnhanced() {
  const [formData, setFormData] = useState(() => {
    // Hydrate keys from sessionStorage when "remember for session" was on
    let apiKey = '', secretKey = '';
    try {
      if (sessionStorage.getItem('cv_remember') === '1') {
        apiKey = sessionStorage.getItem('cv_apiKey') || '';
        secretKey = sessionStorage.getItem('cv_secretKey') || '';
      }
    } catch { /* storage unavailable */ }
    return { apiKey, secretKey, category: 'Hashing', operation: '', value: '', keyAltName: '' };
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showFormatted, setShowFormatted] = useState(true);
  const [resultTime, setResultTime] = useState('');
  const [lastDuration, setLastDuration] = useState(null);
  const [history, setHistory] = useState([]);
  const [outputSearch, setOutputSearch] = useState('');
  const [filterMode, setFilterMode] = useState(true);
  const [foldSignal, setFoldSignal] = useState({ tick: 0, mode: null });
  const [csvFile, setCsvFile] = useState(null);
  const [batchProgress, setBatchProgress] = useState(null);
  const [rememberKeys, setRememberKeys] = useState(() => {
    try { return sessionStorage.getItem('cv_remember') === '1'; } catch { return false; }
  });
  const formRef = useRef(null);
  const outputRef = useRef(null);

  // Persist/clear credentials for this tab session only (opt-in)
  useEffect(() => {
    try {
      if (rememberKeys) {
        sessionStorage.setItem('cv_remember', '1');
        sessionStorage.setItem('cv_apiKey', formData.apiKey);
        sessionStorage.setItem('cv_secretKey', formData.secretKey);
      } else {
        sessionStorage.removeItem('cv_remember');
        sessionStorage.removeItem('cv_apiKey');
        sessionStorage.removeItem('cv_secretKey');
      }
    } catch { /* storage unavailable */ }
  }, [rememberKeys, formData.apiKey, formData.secretKey]);

  useEffect(() => {
    const updateIsSmallScreen = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    updateIsSmallScreen();
    window.addEventListener('resize', updateIsSmallScreen);
    return () => window.removeEventListener('resize', updateIsSmallScreen);
  }, []);

  // Keyboard console affordances: Cmd/Ctrl+Enter submits, Esc dismisses the ledger.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!loading && formRef.current) formRef.current.requestSubmit();
      } else if (e.key === 'Escape') {
        setShowModal(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loading]);


  const operationCategories = [
    {
      name: 'Hashing',
      operations: [
        {
            value: 'MD5_HASH',
            label: 'MD5 Hash',
            description: 'Creates an MD5 hash of the input value. MD5 is considered cryptographically weak.',
            useCase: 'UC related hashing'
        },
        {
          value: 'SHA256_HASH',
          label: 'SHA256 Hash',
          description: 'Creates a SHA256 hash of the input value. This is a one-way cryptographic hash function.',
          useCase: 'All services'
        },
        {
          value: 'SHA256_HASH_BASE_64_ENCODED',
          label: 'SHA256 Hash with Base64 Encoding',
          description: 'Creates a SHA256 hash of the input value and then encodes it in base64. This is a one-way cryptographic hash function.',
          useCase: 'stocker-production related hashing'
        }
      ]
    },
    {
      name: 'Encryption',
      operations: [
        {
          value: 'AES256_RANDOM_ENCRYPTION',
          label: 'AES256 Random Encryption',
          description: 'Encrypts data using AES256 with random initialization vector. Each encryption produces different output.',
          useCase: 'All services'
        },
        {
          value: 'AES256_DETERMINISTIC_ENCRYPTION',
          label: 'AES256 Deterministic Encryption',
          description: 'Encrypts data using AES256 deterministically. Same input always produces same output.',
          useCase: 'Currently, not being used in any service'
        },
        {
          value: 'MONGO_CSFLE_RANDOM_ENCRYPTION',
          label: 'MongoDB CSFLE Random Encryption',
          description: 'Encrypts data using MongoDB Client-Side Field Level Encryption with random encryption. Each encryption produces different output.',
          useCase: 'Currently, not being used in any service'
        },
        {
          value: 'MONGO_CSFLE_DETERMINISTIC_ENCRYPTION',
          label: 'MongoDB CSFLE Deterministic Encryption',
          description: 'Encrypts data using MongoDB Client-Side Field Level Encryption with deterministic encryption. Same input always produces same output.',
          useCase: 'wigzo mongo-db related encryption'
        }
      ]
    },
    {
      name: 'Decryption',
      operations: [
        {
          value: 'AES256_RANDOM_DECRYPTION',
          label: 'AES256 Random Decryption',
          description: 'Decrypts data that was encrypted using AES256 random encryption.',
          useCase: 'All services'
        },
        {
          value: 'AES256_DETERMINISTIC_DECRYPTION',
          label: 'AES256 Deterministic Decryption',
          description: 'Decrypts data that was encrypted using AES256 deterministic encryption.',
          useCase: 'Currently, not being used in any service'
        },
        {
          value: 'MONGO_CSFLE_RANDOM_DECRYPTION',
          label: 'MongoDB CSFLE Random Decryption',
          description: 'Decrypts data that was encrypted using MongoDB CSFLE random encryption.',
          useCase: 'Currently, not being used in any service'
        },
        {
          value: 'MONGO_CSFLE_DETERMINISTIC_DECRYPTION',
          label: 'MongoDB CSFLE Deterministic Decryption',
          description: 'Decrypts data that was encrypted using MongoDB CSFLE deterministic encryption.',
          useCase: 'wigzo mongo-db related decryption'
        }
      ]
    }
  ];

  const getOperationDescription = (operationValue) => {
    for (const category of operationCategories) {
      const operation = category.operations.find(op => op.value === operationValue);
      if (operation) {
        return operation.description;
      }
    }
    return '';
  };

  const getOperationUseCase = (operationValue) => {
    for (const category of operationCategories) {
      const operation = category.operations.find(op => op.value === operationValue);
      if (operation) {
        return operation.useCase;
      }
    }
    return '';
  };

  const getOperationsForCategory = (categoryName) => {
    const category = operationCategories.find(cat => cat.name === categoryName);
    return category ? category.operations : [];
  };

  const shouldShowKeyAltName = (operationValue) => {
    return operationValue === 'MONGO_CSFLE_RANDOM_ENCRYPTION' ||
           operationValue === 'MONGO_CSFLE_DETERMINISTIC_ENCRYPTION';
  };

  // Derive trust micro-tags from the existing description text (no new data).
  const deriveTags = (desc) => {
    if (!desc) return [];
    const d = desc.toLowerCase();
    const tags = [];
    if (d.includes('weak')) tags.push('WEAK');
    if (d.includes('one-way')) tags.push('ONE-WAY');
    if (d.includes('deterministic') || d.includes('same input')) tags.push('DETERMINISTIC');
    if (d.includes('random')) tags.push('RANDOM');
    return tags;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      const copyBtn = document.querySelector('.copy-btn');
      if (copyBtn) {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied ✓';
        copyBtn.style.color = 'var(--accent2)';
        copyBtn.style.borderColor = 'rgba(126,224,193,0.4)';
        setTimeout(() => {
          copyBtn.textContent = originalText;
          copyBtn.style.color = '';
          copyBtn.style.borderColor = '';
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to copy text: ', err);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Reset operation when category changes
      ...(name === 'category' && { operation: '' })
    }));
    // Clear this field's validation error as soon as the user fixes it
    setValidationErrors(prev => {
      if (!prev[name] && !(name === 'category' && prev.operation)) return prev;
      const next = { ...prev };
      delete next[name];
      if (name === 'category') delete next.operation;
      return next;
    });
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.apiKey.trim()) errors.apiKey = 'API Key is required';
    if (!formData.secretKey.trim()) errors.secretKey = 'Secret Key is required';
    if (!formData.category) errors.category = 'Operation is required';
    if (!formData.operation) errors.operation = 'Algorithm is required';
    if (!csvFile && !formData.value.trim()) errors.value = 'Value is required';
    if (csvFile && csvFile.values.length === 0) errors.value = 'CSV has no values — first column is empty';
    if (shouldShowKeyAltName(formData.operation) && !formData.keyAltName.trim()) {
      errors.keyAltName = 'Key Alternative Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const runOperation = async () => {
    setLoading(true);
    setResponse(null);
    setValidationErrors({});

    // Bring the output ledger into view as soon as the operation starts
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const startedAt = performance.now();
    let resp;
    try {
      const apiBase = process.env.NODE_ENV === 'development'
        ? 'http://localhost:3001'
        : '';
      const apiResponse = await fetch(`${apiBase}/api/encryption/perform-op`, {
        method: 'POST',
        headers: {
          'E360-CRYPTO-X-API-KEY': formData.apiKey.trim(),
          'E360-CRYPTO-X-SECRET-KEY': formData.secretKey.trim(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          operation: formData.operation.trim(),
          value: formData.value.trim(),
          ...(shouldShowKeyAltName(formData.operation) && { key_alt_name: formData.keyAltName.trim() })
        })
      });

      const data = await apiResponse.json();

      if (data.status === 'SUCCESS' && data.data && data.data.value) {
        resp = {
          success: true,
          value: data.data.value,
          operation: data.data.operation
        };
      } else if (data.status === 'ERROR') {
        // Normalize: API may omit the error object or send a plain string
        const err = (data.error && typeof data.error === 'object')
          ? data.error
          : { code: String(data.error || 'ERROR'), title: 'Operation failed', message: data.message || 'Unknown error' };
        resp = {
          success: false,
          error: err,
          message: data.message,
          statusCode: data.statusCode
        };
      } else {
        resp = {
          success: true,
          fullResponse: data
        };
      }
    } catch (err) {
      resp = {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          title: 'Network Error',
          message: err.message || 'An error occurred while making the API call'
        },
        message: 'Request failed',
        statusCode: 0
      };
    }

    const durationMs = Math.round(performance.now() - startedAt);
    const timeLabel = new Date().toLocaleTimeString();
    setResponse(resp);
    setResultTime(timeLabel);
    setLastDuration(durationMs);
    setShowFormatted(true);
    setOutputSearch('');
    setShowModal(true);
    setHistory(prev => [{
      id: `${Date.now()}-${prev.length}`,
      timeLabel,
      durationMs,
      category: formData.category,
      operation: formData.operation,
      value: formData.value,
      keyAltName: formData.keyAltName,
      response: resp
    }, ...prev].slice(0, 20));
    setLoading(false);
  };

  /* ===== CSV batch processing ===== */

  // Basic CSV: first column of each non-empty row (handles quoted cells)
  const parseCsvValues = (text) => {
    const values = [];
    const lines = String(text).split(/\r\n|\n|\r/);
    for (const line of lines) {
      if (!line.trim()) continue;
      let cell;
      if (line.startsWith('"')) {
        let i = 1, out = '';
        while (i < line.length) {
          if (line[i] === '"') {
            if (line[i + 1] === '"') { out += '"'; i += 2; } else break;
          } else { out += line[i]; i++; }
        }
        cell = out;
      } else {
        cell = line.split(',')[0];
      }
      cell = cell.trim();
      if (cell) values.push(cell);
    }
    return values;
  };

  const CSV_MAX_VALUES = 520;

  const handleCsvUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const all = parseCsvValues(reader.result || '');
      if (all.length > CSV_MAX_VALUES) {
        setCsvFile(null);
        setValidationErrors(prev => ({
          ...prev,
          value: `CSV has ${all.length} values — maximum ${CSV_MAX_VALUES} allowed. Split the file and retry.`
        }));
        return;
      }
      setCsvFile({ name: file.name, values: all });
      setValidationErrors(prev => ({ ...prev, value: undefined }));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const csvEscape = (s) => {
    const t = String(s ?? '');
    return /[",\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
  };

  const buildResultCsv = (rows) =>
    ['value,processed_value,status']
      .concat(rows.map(r => [csvEscape(r.input), csvEscape(r.ok ? r.output : (r.err || 'error')), r.ok ? 'ok' : 'failed'].join(',')))
      .join('\n');

  const downloadBatchCsv = () => {
    if (!response || !response.batch) return;
    const blob = new Blob([buildResultCsv(response.rows)], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptovault_${(response.operation || 'batch').toLowerCase()}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runBatch = async () => {
    const values = csvFile.values;
    setLoading(true);
    setResponse(null);
    setValidationErrors({});
    setBatchProgress({ done: 0, total: values.length });

    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const startedAt = performance.now();
    const apiBase = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3001'
      : '';
    const results = new Array(values.length);
    let done = 0;

    const processOne = async (idx) => {
      const input = values[idx];
      try {
        const r = await fetch(`${apiBase}/api/encryption/perform-op`, {
          method: 'POST',
          headers: {
            'E360-CRYPTO-X-API-KEY': formData.apiKey.trim(),
            'E360-CRYPTO-X-SECRET-KEY': formData.secretKey.trim(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            operation: formData.operation.trim(),
            value: input,
            ...(shouldShowKeyAltName(formData.operation) && { key_alt_name: formData.keyAltName.trim() })
          })
        });
        const data = await r.json();
        if (data.status === 'SUCCESS' && data.data && data.data.value) {
          results[idx] = { input, output: data.data.value, ok: true };
        } else {
          const err = (data.error && (data.error.message || data.error.code)) || data.message || 'Failed';
          results[idx] = { input, output: '', ok: false, err };
        }
      } catch (e) {
        results[idx] = { input, output: '', ok: false, err: e.message || 'Network error' };
      }
      done++;
      setBatchProgress({ done, total: values.length });
    };

    // Limited concurrency so we don't hammer the API
    const queue = values.map((_, i) => i);
    const worker = async () => { while (queue.length) { await processOne(queue.shift()); } };
    await Promise.all(Array.from({ length: Math.min(4, values.length) }, worker));

    const okCount = results.filter(r => r.ok).length;
    const durationMs = Math.round(performance.now() - startedAt);
    const timeLabel = new Date().toLocaleTimeString();
    const resp = {
      success: okCount > 0,
      batch: true,
      rows: results,
      okCount,
      failCount: values.length - okCount,
      operation: formData.operation
    };
    setResponse(resp);
    setResultTime(timeLabel);
    setLastDuration(durationMs);
    setBatchProgress(null);
    setShowModal(true);
    setHistory(prev => [{
      id: `${Date.now()}-${prev.length}`,
      timeLabel,
      durationMs,
      category: formData.category,
      operation: formData.operation,
      value: '',
      keyAltName: formData.keyAltName,
      response: resp
    }, ...prev].slice(0, 20));
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (csvFile && csvFile.values.length > 0) {
      runBatch();
    } else {
      runOperation();
    }
  };

  // Reset clears only the operation inputs — credentials stay put
  const resetForm = () => {
    setFormData(prev => ({
      ...prev,
      category: 'Hashing',
      operation: '',
      value: '',
      keyAltName: ''
    }));
    setCsvFile(null);
    setResponse(null);
    setValidationErrors({});
    setShowModal(false);
  };

  // Encryption ↔ Decryption counterpart for output chaining
  const getInverseOperation = (op) => {
    if (!op) return null;
    if (op.includes('_ENCRYPTION')) {
      return { category: 'Decryption', operation: op.replace('_ENCRYPTION', '_DECRYPTION') };
    }
    if (op.includes('_DECRYPTION')) {
      return { category: 'Encryption', operation: op.replace('_DECRYPTION', '_ENCRYPTION') };
    }
    return null;
  };

  // Feed the current output back into the form as the next input
  const chainOutput = () => {
    if (!response || !response.value) return;
    const inverse = getInverseOperation(response.operation || formData.operation);
    setFormData(prev => ({
      ...prev,
      value: response.value,
      ...(inverse ? { category: inverse.category, operation: inverse.operation } : {})
    }));
    setShowModal(false);
    requestAnimationFrame(() => {
      document.getElementById('value')?.focus();
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Restore a past run: form inputs + its result in the ledger
  const restoreRun = (h) => {
    setFormData(prev => ({
      ...prev,
      category: h.category,
      operation: h.operation,
      value: h.value,
      keyAltName: h.keyAltName || ''
    }));
    setResponse(h.response);
    setResultTime(h.timeLabel);
    setLastDuration(h.durationMs);
    setShowFormatted(true);
    setOutputSearch('');
    setShowModal(true);
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const buildStamp = (() => {
    try {
      return new Date(versionInfo.buildTime).toLocaleString(undefined, {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
      });
    } catch { return versionInfo.buildTime; }
  })();
  const buildTitle = `Build ${versionInfo.commit} · ${new Date(versionInfo.buildTime).toLocaleString()}`;

  const bothCreds = formData.apiKey.trim() && formData.secretKey.trim();

  // Run stays disabled until every required field is filled
  const formReady = Boolean(
    bothCreds &&
    formData.category &&
    formData.operation &&
    (csvFile ? csvFile.values.length > 0 : formData.value.trim()) &&
    (!shouldShowKeyAltName(formData.operation) || formData.keyAltName.trim())
  );
  const hasResult = showModal && response;
  const outputValue = response && response.value ? response.value : '';
  const parsedOutput = useMemo(() => {
    if (!outputValue) return undefined;
    try { return JSON.parse(outputValue); } catch { return undefined; }
  }, [outputValue]);
  // Only objects/arrays benefit from tree formatting
  const canFormat = parsedOutput !== undefined && typeof parsedOutput === 'object' && parsedOutput !== null;
  const formattedOutput = canFormat ? JSON.stringify(parsedOutput, null, 2) : null;
  const displayValue = showFormatted && canFormat ? formattedOutput : outputValue;

  // Live match count for the output search
  const matchCount = useMemo(() => {
    const q = outputSearch.trim().toLowerCase();
    if (!q || !canFormat) return 0;
    let count = 0;
    const walk = (node) => {
      if (node === null || node === undefined) return;
      if (typeof node === 'object') {
        const entries = Array.isArray(node) ? node.map(v => [null, v]) : Object.entries(node);
        for (const [k, v] of entries) {
          if (k && k.toLowerCase().includes(q)) count++;
          walk(v);
        }
      } else if (typeof node !== 'boolean' && String(node).toLowerCase().includes(q)) {
        count++;
      }
    };
    walk(parsedOutput);
    return count;
  }, [outputSearch, canFormat, parsedOutput]);

  return (
    <div className="AppEnhanced">
      <div className="main-container">
        {/* ===== Chrome bar ===== */}
        <div className="chrome-bar">
          <div className="chrome-left">
            <span className="chrome-lock"><LockIcon size={16} /></span>
            <span className="wordmark">CryptoVault</span>
            <span className="version-chip" title={buildTitle}>v{versionInfo.version}</span>
            <span className="chrome-divider" />
            <span className="chrome-subtitle">cryptographic operations console</span>
          </div>
          <div className="chrome-right">
            <span className={`cred-pill ${bothCreds ? 'loaded' : ''}`}>
              <span className="cred-dot" />
              {bothCreds ? 'keys loaded' : 'no credentials'}
            </span>
            <span className="kbd">⌘↵</span>
          </div>
        </div>

        {/* ===== Body ===== */}
        <div className="console-body">
          <div className="layout-grid">
            {/* Left rail: credentials + run history */}
            <div className="rail">
            <div className="credentials-section">
              <div className="credentials-header">
                <LockIcon size={14} />
                <h3>API Credentials</h3>
                <span className="sealed-badge">SEALED</span>
              </div>

              <div className="credentials-content">
                <div className="form-group">
                  <label htmlFor="apiKey">API Key</label>
                  <input
                    type="text"
                    id="apiKey"
                    name="apiKey"
                    value={formData.apiKey}
                    onChange={handleInputChange}
                    placeholder="Enter your API key"
                    className={validationErrors.apiKey ? 'error' : ''}
                  />
                  {validationErrors.apiKey && (
                    <span className="error-message">{validationErrors.apiKey}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="secretKey">Secret Key</label>
                  <div className="secret-wrap">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      id="secretKey"
                      name="secretKey"
                      value={formData.secretKey}
                      onChange={handleInputChange}
                      placeholder="Enter your secret key"
                      className={validationErrors.secretKey ? 'error' : ''}
                    />
                    <button
                      type="button"
                      className="eye-btn"
                      onClick={() => setShowSecret(s => !s)}
                      title={showSecret ? 'Hide secret key' : 'Reveal secret key'}
                      aria-label={showSecret ? 'Hide secret key' : 'Reveal secret key'}
                    >
                      <span key={showSecret ? 'open' : 'closed'} className="eye-swap">
                        <EyeIcon open={showSecret} />
                      </span>
                    </button>
                  </div>
                  {validationErrors.secretKey && (
                    <span className="error-message">{validationErrors.secretKey}</span>
                  )}
                </div>

                <label className="remember-row" title="Keys live in sessionStorage and clear when this tab closes">
                  <input
                    type="checkbox"
                    checked={rememberKeys}
                    onChange={(e) => setRememberKeys(e.target.checked)}
                  />
                  <span className="switch" aria-hidden="true" />
                  <span className="remember-text">Remember keys for this session</span>
                </label>
                <p className="cred-note">{rememberKeys ? 'Keys stay in this tab only — cleared when it closes.' : 'Keys are sent per-request, never stored.'}</p>
              </div>
            </div>

            {/* Run history */}
            <div className="history-section">
              <div className="history-header">
                <ClockIcon />
                <h3>History</h3>
                {history.length > 0 && (
                  <button type="button" className="history-clear" onClick={() => setHistory([])} title="Clear history">
                    Clear
                  </button>
                )}
              </div>
              {history.length === 0 ? (
                <p className="history-empty">No runs yet — results will appear here.</p>
              ) : (
                <ul className="history-list">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        type="button"
                        className="history-item"
                        onClick={() => restoreRun(h)}
                        title={`${h.operation} · ${h.timeLabel} · ${h.durationMs}ms`}
                      >
                        <span className={`history-dot ${h.response.success ? 'ok' : 'err'}`} />
                        <span className="history-op">{h.operation}</span>
                        <span className="history-time">{h.timeLabel}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </div>

            {/* Operation builder */}
            <div className="form-section">
              <form ref={formRef} onSubmit={handleSubmit} className="compact-form">
                <div className="form-group">
                  <label>Operation</label>
                  {isSmallScreen ? (
                    <select
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                    >
                      <option value="">Select category</option>
                      {operationCategories.map((category) => (
                        <option key={category.name} value={category.name}>{category.name}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="radio-group">
                      {operationCategories.map((category) => (
                        <label key={category.name} className="radio-option">
                          <input
                            type="radio"
                            name="category"
                            value={category.name}
                            checked={formData.category === category.name}
                            onChange={handleInputChange}
                          />
                          <span className="radio-label">{category.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                  {validationErrors.category && (
                    <span className="error-message">{validationErrors.category}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="operation">Algorithm</label>
                  <select
                    id="operation"
                    name="operation"
                    value={formData.operation}
                    onChange={handleInputChange}
                    className={validationErrors.operation ? 'error' : ''}
                    disabled={!formData.category}
                  >
                    <option value="">{formData.category ? 'Select algorithm' : 'Select a category first'}</option>
                    {formData.category && getOperationsForCategory(formData.category).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {validationErrors.operation && (
                    <span className="error-message">{validationErrors.operation}</span>
                  )}
                  {formData.operation && (
                    <div className="algo-info">
                      <div className="algo-token-row">
                        <span className="algo-token">{formData.operation}</span>
                        {deriveTags(getOperationDescription(formData.operation)).map((tag) => (
                          <span key={tag} className="strength-tag">{tag}</span>
                        ))}
                      </div>
                      <p className="algo-desc">{getOperationDescription(formData.operation)}</p>
                    </div>
                  )}
                </div>

                {/* Use case — animated reveal, no layout shift */}
                <div className={`reveal ${formData.operation ? 'open' : ''}`}>
                  <div className="reveal-inner">
                    <div className="reveal-content">
                      <div className="operation-usecase">
                        <span className="uc-label">Use case</span>
                        <span className="uc-text">{getOperationUseCase(formData.operation)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="value" className="field-label">Value</label>
                    <span className="label-actions">
                      {!csvFile && <span className="char-counter">{formData.value.length}</span>}
                      <label className="upload-btn" title="Upload a CSV — every value in the first column gets processed in batch">
                        <input type="file" accept=".csv,text/csv,text/plain" onChange={handleCsvUpload} />
                        Upload CSV
                      </label>
                    </span>
                  </div>
                  {csvFile && (
                    <div className="csv-chip">
                      <span className="csv-name" title={csvFile.name}>{csvFile.name}</span>
                      <span className="csv-count">{csvFile.values.length} values</span>
                      <button type="button" className="csv-remove" onClick={() => setCsvFile(null)} title="Remove CSV">×</button>
                    </div>
                  )}
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder={csvFile ? 'Using values from CSV' : 'Enter value to process'}
                    disabled={!!csvFile}
                    className={validationErrors.value ? 'error' : ''}
                  />
                  {validationErrors.value && (
                    <span className="error-message">{validationErrors.value}</span>
                  )}
                </div>

                {/* Key Alternative Name — animated reveal */}
                <div className={`reveal ${shouldShowKeyAltName(formData.operation) ? 'open' : ''}`}>
                  <div className="reveal-inner">
                    <div className="reveal-content">
                      <div className="form-group">
                        <label htmlFor="keyAltName">Key Alternative Name</label>
                        <input
                          type="text"
                          id="keyAltName"
                          name="keyAltName"
                          value={formData.keyAltName}
                          onChange={handleInputChange}
                          placeholder="Enter key alternative name"
                          className={validationErrors.keyAltName ? 'error' : ''}
                        />
                        {validationErrors.keyAltName && (
                          <span className="error-message">{validationErrors.keyAltName}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="button-group">
                  <button
                    type="submit"
                    disabled={loading || !formReady}
                    className="submit-btn"
                    title={formReady ? 'Run operation (⌘↵)' : 'Fill all required fields first'}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Processing…
                      </>
                    ) : (
                      'Run operation'
                    )}
                  </button>
                  <span className="kbd kbd-inline">⌘↵</span>
                  <button type="button" onClick={resetForm} className="reset-btn">
                    Reset
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* ===== Output ledger (always mounted) ===== */}
          <div className="output-region" ref={outputRef} aria-live="polite">
            {loading ? (
              <div className="ledger running">
                <div className="ledger-head">
                  <span className="status-dot" />
                  <span className="status-label">RUNNING</span>
                  {formData.operation && <span className="algo-token">{formData.operation}</span>}
                </div>
                <div className="ledger-body">
                  {batchProgress ? (
                    <>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${batchProgress.total ? Math.round((batchProgress.done / batchProgress.total) * 100) : 0}%` }}
                        />
                      </div>
                      <span className="progress-text">{batchProgress.done}/{batchProgress.total} processed</span>
                    </>
                  ) : (
                    <>
                      <span className="skel" style={{ width: '82%' }} />
                      <span className="skel" style={{ width: '58%' }} />
                      <span className="skel" style={{ width: '71%' }} />
                    </>
                  )}
                </div>
              </div>
            ) : hasResult ? (
              response.batch ? (
                <div className={`ledger batch ${response.failCount === 0 ? 'success' : response.okCount === 0 ? 'error' : 'partial'}`}>
                  <div className="ledger-head">
                    <span className="status-dot" />
                    <span className="status-label">
                      {response.failCount === 0 ? 'OK' : response.okCount === 0 ? 'ERROR' : 'PARTIAL'}
                    </span>
                    <span className="ledger-time">{resultTime}</span>
                    {lastDuration != null && <span className="duration-badge">{lastDuration} ms</span>}
                    <span className="algo-token">{response.operation}</span>
                    <span className="byte-badge">
                      {response.rows.length} rows · {response.okCount} ok · {response.failCount} failed
                    </span>
                  </div>
                  <div className="ledger-body">
                    <div className="label-row">
                      <span className="field-label">Results</span>
                      <div className="ledger-actions">
                        <button
                          type="button"
                          className="ghost-btn text"
                          onClick={downloadBatchCsv}
                          title="Download CSV with value → processed_value mapping"
                        >
                          Download CSV
                        </button>
                      </div>
                    </div>
                    <div className="batch-table">
                      {response.rows.map((r, i) => (
                        <div key={i} className={`batch-row ${r.ok ? '' : 'fail'}`}>
                          <span className="batch-idx">{i + 1}</span>
                          <span className="batch-in" title={r.input}>{r.input}</span>
                          <RowCopyBtn text={r.input} label="Copy value" />
                          <span className="batch-arrow">→</span>
                          <span className="batch-out" title={r.ok ? r.output : r.err}>
                            {r.ok ? r.output : (r.err || 'failed')}
                          </span>
                          {r.ok ? (
                            <RowCopyBtn text={r.output} label="Copy processed value" />
                          ) : (
                            <span className="row-copy-slot" />
                          )}
                        </div>
                      ))}
                    </div>
                    <span className="ledger-hint">Esc to dismiss · Download CSV saves the value → processed mapping</span>
                  </div>
                </div>
              ) : response.success ? (
                <div className="ledger success">
                  <div className="ledger-head">
                    <span className="status-dot" />
                    <span className="status-label">OK</span>
                    <span className="ledger-time">{resultTime}</span>
                    {lastDuration != null && <span className="duration-badge">{lastDuration} ms</span>}
                    <span className="algo-token">
                      {response.value ? response.operation : (response.fullResponse?.data?.operation || response.operation)}
                    </span>
                    {response.value && (
                      <span className="byte-badge">{response.value.length} chars</span>
                    )}
                  </div>
                  <div className="ledger-body">
                    <div className="label-row">
                      <span className="field-label">Output</span>
                      {response.value && (
                        <div className="ledger-actions">
                          <button
                            type="button"
                            className="ghost-btn text"
                            onClick={chainOutput}
                            title="Use this output as the next input (auto-flips encrypt/decrypt)"
                          >
                            Use as input
                          </button>
                          {canFormat && (
                            <button
                              type="button"
                              className={`ghost-btn text ${showFormatted ? 'active' : ''}`}
                              onClick={() => setShowFormatted(s => !s)}
                              title={showFormatted ? 'Show raw output' : 'Format as JSON'}
                            >
                              {showFormatted ? 'Raw' : 'Format'}
                            </button>
                          )}
                          <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(displayValue)}
                            title="Copy to clipboard"
                          >
                            Copy
                          </button>
                        </div>
                      )}
                    </div>
                    {response.value && canFormat && showFormatted && (
                      <div className="output-controls">
                        <label htmlFor="jsonSearch" className="search-label">Search</label>
                        <input
                          type="text"
                          id="jsonSearch"
                          name="jsonSearch"
                          className="json-search"
                          placeholder="Search keys & values…"
                          aria-label="Search output JSON"
                          value={outputSearch}
                          onChange={(e) => setOutputSearch(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); setOutputSearch(''); } }}
                        />
                        <label className="filter-toggle" title="Show only the keys that match the search">
                          <input
                            type="checkbox"
                            checked={filterMode}
                            onChange={(e) => setFilterMode(e.target.checked)}
                          />
                          <span className="switch" aria-hidden="true" />
                          <span className="filter-text">Only matches</span>
                        </label>
                        {outputSearch.trim() && (
                          <span className="match-count">{matchCount} match{matchCount === 1 ? '' : 'es'}</span>
                        )}
                        <span className="controls-spacer" />
                        <button type="button" className="ghost-btn text" onClick={() => setFoldSignal(s => ({ tick: s.tick + 1, mode: 'fold' }))}>
                          Fold all
                        </button>
                        <button type="button" className="ghost-btn text" onClick={() => setFoldSignal(s => ({ tick: s.tick + 1, mode: 'unfold' }))}>
                          Expand all
                        </button>
                      </div>
                    )}
                    {response.value ? (
                      <div className="value-box">
                        <div className="value-scroll">
                          {showFormatted && canFormat ? (
                            outputSearch.trim() && filterMode && matchCount === 0 ? (
                              <span className="no-matches">No matches for “{outputSearch.trim()}”</span>
                            ) : (
                              <div className="json-tree">
                                <JsonNode
                                  value={parsedOutput}
                                  depth={0}
                                  isLast={true}
                                  search={outputSearch.trim()}
                                  foldSignal={foldSignal}
                                  filter={filterMode}
                                />
                              </div>
                            )
                          ) : (
                            <span className="value-text">{displayValue}</span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="value-box">
                        <div className="value-scroll">
                          <span className="value-text">—</span>
                        </div>
                      </div>
                    )}
                    <span className="ledger-hint">Esc to dismiss{canFormat ? ' · Format pretty-prints JSON' : ''}</span>
                  </div>
                </div>
              ) : (
                <div className="ledger error">
                  <div className="ledger-head">
                    <span className="status-dot" />
                    <span className="status-label">ERROR</span>
                    <span className="ledger-time">{resultTime}</span>
                    {lastDuration != null && <span className="duration-badge">{lastDuration} ms</span>}
                    <button type="button" className="ghost-btn text retry-btn" onClick={() => { if (validateForm()) runOperation(); }} title="Run the same request again">
                      Retry
                    </button>
                  </div>
                  <div className="ledger-body error-info">
                    <div className="err-row">
                      <span className="err-key">Code</span>
                      <span className="err-val code">{response.error?.code || '—'}</span>
                    </div>
                    <div className="err-row">
                      <span className="err-key">Title</span>
                      <span className="err-val">{response.error?.title || '—'}</span>
                    </div>
                    <div className="err-row">
                      <span className="err-key">Message</span>
                      <span className="err-val">{response.error?.message || response.message || 'Unknown error'}</span>
                    </div>
                    {response.statusCode ? (
                      <div className="err-row">
                        <span className="err-key">Status</span>
                        <span className="err-val code">{response.statusCode}</span>
                      </div>
                    ) : null}
                    <span className="ledger-hint">Esc to dismiss</span>
                  </div>
                </div>
              )
            ) : (
              <div className="ledger-empty">
                <LockIcon size={18} />
                <span className="ledger-empty-text">
                  Run an operation to see output
                  <span className="kbd">⌘↵</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ===== Footer ===== */}
        <div className="console-footer">
          <p className="main-description">
            A cryptographic operations platform for secure hashing, encryption and decryption — used in{' '}
            <a href="https://app-engage.shiprocket.in/" target="_blank" rel="noopener noreferrer" className="inline-link">Engage-360</a>.
          </p>
          <div className="footer-right">
            <span className="build-tag" title={buildTitle}>
              <span className="build-dot" /> {versionInfo.version} · #{versionInfo.commit} · {buildStamp}
            </span>
            <p className="powered-by">
              Powered by <a href="https://app.shiprocket.in/" target="_blank" rel="noopener noreferrer"><span className="shiprocket-brand">Shiprocket</span></a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AppEnhanced;
