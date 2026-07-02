import React, { useState, useEffect } from 'react';
import './AppEnhanced.css';

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
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const updateIsSmallScreen = () => {
      setIsSmallScreen(window.innerWidth <= 768);
    };
    updateIsSmallScreen();
    window.addEventListener('resize', updateIsSmallScreen);
    return () => window.removeEventListener('resize', updateIsSmallScreen);
  }, []);


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

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      const copyBtn = document.querySelector('.copy-btn');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = '✅';
      copyBtn.style.background = '#28a745';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
      }, 2000);
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
    setError(null);
    setResponse(null);
    setValidationErrors({});

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
    setError(null);
    setValidationErrors({});
    setShowModal(false);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className="AppEnhanced">
      <div className="main-container">
        <div className="header">
          <h1>CryptoVault</h1>
          <div className="header-description">
            <p className="main-description">A comprehensive cryptographic operations platform that provides secure hashing, encryption, and decryption operations currently being used in <a href="https://app-engage.shiprocket.in/" target="_blank" rel="noopener noreferrer" className="inline-link">Engage-360</a>.</p>
            <p className="powered-by">Powered by <a href="https://app.shiprocket.in/" target="_blank" rel="noopener noreferrer"><span className="shiprocket-brand">Shiprocket</span></a></p>
          </div>
        </div>

        <div className="layout-grid">
          {/* Credentials Section */}
          <div className="credentials-section">
            <div className="credentials-header">
              <div className="credentials-title">
                <span className="credentials-icon">🔐</span>
                <h3>API Credentials</h3>
              </div>
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
                <input
                  type="password"
                  id="secretKey"
                  name="secretKey"
                  value={formData.secretKey}
                  onChange={handleInputChange}
                  placeholder="Enter your secret key"
                  className={validationErrors.secretKey ? 'error' : ''}
                />
                {validationErrors.secretKey && (
                  <span className="error-message">{validationErrors.secretKey}</span>
                )}
              </div>
            </div>
          </div>

          {/* Main Form Section */}
          <div className="form-section">
            <form onSubmit={handleSubmit} className="compact-form">
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
                <div className="input-with-tooltip">
                  <select
                    id="operation"
                    name="operation"
                    value={formData.operation}
                    onChange={handleInputChange}
                    className={validationErrors.operation ? 'error' : ''}
                    disabled={!formData.category}
                  >
                    <option value="">Select algorithm</option>
                    {formData.category && getOperationsForCategory(formData.category).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                  {formData.operation && (
                    <div className="tooltip-container">
                      <span className="tooltip-icon" title="Algorithm Description">ℹ️</span>
                      <div className="tooltip-content">
                        <div className="tooltip-section">
                          <strong>Description:</strong>
                          <p>{getOperationDescription(formData.operation)}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {validationErrors.operation && (
                  <span className="error-message">{validationErrors.operation}</span>
                )}
              </div>

              {formData.operation && (
                <div className="operation-usecase compact">
                  <p><strong>Use Case:</strong> {getOperationUseCase(formData.operation)}</p>
                </div>
              )}



              <div className="form-group">
                <label htmlFor="value">Value</label>
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

              {shouldShowKeyAltName(formData.operation) && (
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
              )}

              <div className="button-group">
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Processing...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
                <button type="button" onClick={resetForm} className="reset-btn">
                  Reset
                </button>
              </div>
            </form>

            {error && (
              <div className="result error compact">
                <h3>Error</h3>
                <p>{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Modal for displaying results */}
        {showModal && response && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className={`modal-header ${!response.success ? 'error-header' : ''}`}>
                <h3 className={response.success ? 'success-title' : 'error-title'}>
                  {response.success ? '✅ Operation Successful' : '❌ Operation Failed'}
                </h3>
                <button className="modal-close" onClick={closeModal}>×</button>
              </div>
              <div className="modal-body">
                {response.success ? (
                  // Success case
                  response.value ? (
                    <div className="value-container">
                      <div className="operation-info">
                        <label>Operation:</label>
                        <div className="value-box operation-box">
                          <span className="value-text operation-text">{response.operation}</span>
                        </div>
                      </div>
                      <div className="value-display">
                        <label>Output Value:</label>
                        <div className="value-box">
                          <span className="value-text" id="result-value">{response.value}</span>
                          <button
                            className="copy-btn"
                            onClick={() => copyToClipboard(response.value)}
                            title="Copy to clipboard"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="value-container">
                      <div className="operation-info">
                        <label>Operation:</label>
                        <div className="value-box operation-box">
                          <span className="value-text operation-text">{response.fullResponse?.data?.operation || response.operation}</span>
                        </div>
                      </div>
                      <div className="value-display">
                        <label>Output Value:</label>
                        <div className="value-box">
                          <span className="value-text" id="result-value">—</span>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  // Error case
                  <div className="error-container">
                    <div className="error-info">
                      <div className="error-code">
                        <span className="modal-error-label">Error Code:</span>
                        <span className="error-value">{response.error.code}</span>
                      </div>
                      <div className="error-title">
                        <span className="modal-error-label">Error Title:</span>
                        <span className="error-value">{response.error.title}</span>
                      </div>
                      <div className="error-message">
                        <span className="modal-error-label">Error Message:</span>
                        <span className="error-value">{response.error.message}</span>
                      </div>
                      {response.statusCode && (
                        <div className="error-status">
                          <span className="modal-error-label">Status Code:</span>
                          <span className="error-value">{response.statusCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className={`modal-footer ${!response.success ? 'error-footer' : ''}`}>
                <button className={`modal-ok-btn ${!response.success ? 'error-btn' : ''}`} onClick={closeModal}>
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AppEnhanced;
