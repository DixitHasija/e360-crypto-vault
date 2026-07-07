import React, { useState, useEffect, useRef } from 'react';
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
const JsonPrimitive = ({ value }) => {
  if (value === null) return <span className="json-null">null</span>;
  switch (typeof value) {
    case 'string': return <span className="json-str">"{value}"</span>;
    case 'number': return <span className="json-num">{String(value)}</span>;
    case 'boolean': return <span className="json-bool">{String(value)}</span>;
    default: return <span className="json-str">{String(value)}</span>;
  }
};

function JsonNode({ keyName, value, depth, isLast }) {
  const [open, setOpen] = useState(true);
  const isObj = value !== null && typeof value === 'object';
  const indent = { paddingLeft: depth * 18 };
  const bracketClass = `json-bracket d${depth % 3}`;

  if (!isObj) {
    return (
      <div className="json-row" style={indent}>
        <span className="json-caret spacer" />
        {keyName !== undefined && (
          <><span className="json-key">"{keyName}"</span><span className="json-colon">: </span></>
        )}
        <JsonPrimitive value={value} />
        {!isLast && <span className="json-comma">,</span>}
      </div>
    );
  }

  const isArr = Array.isArray(value);
  const entries = isArr ? value.map((v, i) => [i, v]) : Object.entries(value);
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
          <><span className="json-key">"{keyName}"</span><span className="json-colon">: </span></>
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
  const [formData, setFormData] = useState({
    apiKey: '',
    secretKey: '',
    category: '',
    operation: '',
    value: '',
    keyAltName: ''
  });
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showFormatted, setShowFormatted] = useState(true);
  const [resultTime, setResultTime] = useState('');
  const formRef = useRef(null);
  const outputRef = useRef(null);

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
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.apiKey.trim()) errors.apiKey = 'API Key is required';
    if (!formData.secretKey.trim()) errors.secretKey = 'Secret Key is required';
    if (!formData.category) errors.category = 'Operation is required';
    if (!formData.operation) errors.operation = 'Algorithm is required';
    if (!formData.value.trim()) errors.value = 'Value is required';
    if (shouldShowKeyAltName(formData.operation) && !formData.keyAltName.trim()) {
      errors.keyAltName = 'Key Alternative Name is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setResponse(null);
    setValidationErrors({});

    // Bring the output ledger into view as soon as the operation starts
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

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
        setResponse({
          success: true,
          value: data.data.value,
          operation: data.data.operation
        });
      } else if (data.status === 'ERROR') {
        setResponse({
          success: false,
          error: data.error,
          message: data.message,
          statusCode: data.statusCode
        });
      } else {
        setResponse({
          success: true,
          fullResponse: data
        });
      }
      setResultTime(new Date().toLocaleTimeString());
      setShowFormatted(true);
      setShowModal(true);
    } catch (err) {
      setResponse({
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          title: 'Network Error',
          message: err.message || 'An error occurred while making the API call'
        },
        message: 'Request failed',
        statusCode: 0
      });
      setResultTime(new Date().toLocaleTimeString());
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      apiKey: '',
      secretKey: '',
      category: '',
      operation: '',
      value: '',
      keyAltName: ''
    });
    setResponse(null);
    setValidationErrors({});
    setShowModal(false);
  };

  const buildStamp = (() => {
    try { return new Date(versionInfo.buildTime).toLocaleString(); } catch { return versionInfo.buildTime; }
  })();
  const buildTitle = `Build ${versionInfo.commit} · ${buildStamp}`;

  const bothCreds = formData.apiKey.trim() && formData.secretKey.trim();
  const hasResult = showModal && response;
  const outputValue = response && response.value ? response.value : '';
  const parsedOutput = (() => {
    if (!outputValue) return undefined;
    try { return JSON.parse(outputValue); } catch { return undefined; }
  })();
  // Only objects/arrays benefit from tree formatting
  const canFormat = parsedOutput !== undefined && typeof parsedOutput === 'object' && parsedOutput !== null;
  const formattedOutput = canFormat ? JSON.stringify(parsedOutput, null, 2) : null;
  const displayValue = showFormatted && canFormat ? formattedOutput : outputValue;

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
            {/* Credentials rail */}
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
                      <EyeIcon open={showSecret} />
                    </button>
                  </div>
                  {validationErrors.secretKey && (
                    <span className="error-message">{validationErrors.secretKey}</span>
                  )}
                </div>

                <p className="cred-note">Keys are sent per-request, never stored.</p>
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
                    <span className="char-counter">{formData.value.length}</span>
                  </div>
                  <input
                    type="text"
                    id="value"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    placeholder="Enter value to process"
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
                  <button type="submit" disabled={loading} className="submit-btn">
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
          <div className="output-region" ref={outputRef}>
            {hasResult ? (
              response.success ? (
                <div className="ledger success">
                  <div className="ledger-head">
                    <span className="status-dot" />
                    <span className="status-label">OK</span>
                    <span className="ledger-time">{resultTime}</span>
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
                    {response.value ? (
                      <div className="value-box">
                        <div className="value-scroll">
                          {showFormatted && canFormat ? (
                            <div className="json-tree">
                              <JsonNode value={parsedOutput} depth={0} isLast={true} />
                            </div>
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
                  </div>
                  <div className="ledger-body error-info">
                    <div className="err-row">
                      <span className="err-key">Code</span>
                      <span className="err-val code">{response.error.code}</span>
                    </div>
                    <div className="err-row">
                      <span className="err-key">Title</span>
                      <span className="err-val">{response.error.title}</span>
                    </div>
                    <div className="err-row">
                      <span className="err-key">Message</span>
                      <span className="err-val">{response.error.message}</span>
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
              <span className="build-dot" /> {versionInfo.version} · #{versionInfo.commit}
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
