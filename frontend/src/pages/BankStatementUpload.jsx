import React, { useState } from 'react';
import { useAuth } from '../utils/AuthContext';
import { uploadAPI} from '../utils/api';
import { 
  Upload, 
  FileText, 
  PieChart, 
  TrendingUp,
  Download,
  CheckCircle,
  AlertCircle,
  Sparkles,
  BanknoteIcon,
  Save,
  Eye,
  Edit
} from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const BankStatementUpload = () => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFileUpload = async (file) => {
    if (!file) return;
    
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size too large. Please upload a PDF under 10MB');
      return;
    }

    setUploading(true);
    setError('');
    setUploadResult(null);
    setSaveSuccess(false);

    try {
      const response = await uploadAPI.uploadStatement(file, user.user_id);
      
      if (response.data.success) {
        setUploadResult(response.data);
      } else {
        setError(response.data.error || 'Failed to process PDF');
      }
    } catch (err) {
      console.error('Upload error:', err);
      const errorMessage = err.response?.data?.detail || 
                          err.response?.data?.error || 
                          err.message || 
                          'Failed to process PDF. Please try again.';
      setError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveTransactions = async () => {
    if (!uploadResult?.data?.transactions?.length) return;
    
    setSaving(true);
    setError('');

    try {
      const response = await uploadAPI.saveExtractedTransactions(
        user.user_id,
        uploadResult.statement_id,
        uploadResult.data.transactions
      );

      if (response.data.success) {
        setSaveSuccess(true);
        // Update the upload result to show transactions are saved
        setUploadResult(prev => ({
          ...prev,
          transactions_saved: true,
          saved_count: response.data.saved_count
        }));
      } else {
        setError('Failed to save transactions to profile');
      }
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err.response?.data?.detail || 
                          'Failed to save transactions. Please try again.';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleViewFullAnalysis = () => {
    setShowTransactions(true);
  };

  const handleExportReport = () => {
    // Implement export functionality
    console.log('Export report', uploadResult);
  };

  const handleCloseTransactions = () => {
    setShowTransactions(false);
  };

  return (
    <div className="pdf-upload-container">
      <div className="main-content">
        {/* Header */}
        <div className="page-header">
          <div className="page-header-content">
            <div className="page-title-section">
              <h1>Bank Statement Analysis</h1>
              <p>Upload your bank statement PDF for AI-powered insights</p>
            </div>
            <div className="upload-stats">
              <div className="stat-item">
                <FileText size={20} />
                <span>PDF Upload</span>
              </div>
              <div className="stat-item">
                <Sparkles size={20} />
                <span>AI Analysis</span>
              </div>
              <div className="stat-item">
                <TrendingUp size={20} />
                <span>Save to Profile</span>
              </div>
            </div>
          </div>
        </div>

        <div className="upload-content-grid">
          {/* Upload Section */}
          <div className="upload-section-card">
            <div className="upload-section-header">
              <BanknoteIcon size={24} />
              <h2>Upload Bank Statement</h2>
            </div>

            {error && (
              <div className="upload-error">
                <AlertCircle size={20} />
                {error}
              </div>
            )}

            {saveSuccess && (
              <div className="save-success">
                <CheckCircle size={20} />
                <span>Transactions saved to your profile successfully!</span>
              </div>
            )}

            {uploading ? (
              <div className="upload-loading">
                <LoadingSpinner />
                <p>Processing your bank statement...</p>
                <p className="upload-subtext">AI is analyzing your transactions</p>
              </div>
            ) : (
              <div
                className={`upload-area ${dragOver ? 'drag-over' : ''}`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <div className="upload-icon">
                  <Upload size={48} />
                </div>
                <h3>Drop your bank statement here</h3>
                <p>Supported format: PDF only</p>
                <p className="upload-subtext">Max file size: 10MB</p>
                
                <div className="upload-button-wrapper">
                  <input
                    type="file"
                    id="pdf-upload"
                    accept=".pdf"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    className="file-input"
                    disabled={uploading}
                  />
                  <label htmlFor="pdf-upload" className="upload-button">
                    <FileText size={20} />
                    Choose PDF File
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Results Section */}
          {uploadResult && (
            <div className="results-section-card">
              <div className="results-header">
                <CheckCircle size={24} className="success-icon" />
                <h2>Analysis Complete!</h2>
                <p className="success-message">
                  Successfully processed {uploadResult.data?.transactions?.length || 0} transactions
                  {uploadResult.data?.bank_type && ` from ${uploadResult.data.bank_type}`}
                </p>
                
                {/* Save Status */}
                {uploadResult.transactions_saved ? (
                  <div className="save-status saved">
                    <CheckCircle size={16} />
                    <span>{uploadResult.saved_count || uploadResult.data?.transactions?.length} transactions saved to profile</span>
                  </div>
                ) : (
                  <div className="save-status unsaved">
                    <AlertCircle size={16} />
                    <span>Transactions not saved to profile yet</span>
                  </div>
                )}
              </div>

              {/* Account Information */}
              {uploadResult.data?.account_info && (
                <div className="account-info-section">
                  <h3>Account Details</h3>
                  <div className="account-details">
                    <div className="account-detail">
                      <span>Bank:</span>
                      <span>{uploadResult.data.account_info.bank_name}</span>
                    </div>
                    <div className="account-detail">
                      <span>Account Holder:</span>
                      <span>{uploadResult.data.account_info.account_holder}</span>
                    </div>
                    <div className="account-detail">
                      <span>Account Number:</span>
                      <span>{uploadResult.data.account_info.account_number}</span>
                    </div>
                    {uploadResult.data.account_info.branch && (
                      <div className="account-detail">
                        <span>Branch:</span>
                        <span>{uploadResult.data.account_info.branch}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Summary */}
              {uploadResult.data?.summary && (
                <div className="analysis-summary">
                  <h3>Financial Summary</h3>
                  <div className="summary-grid">
                    <div className="summary-item">
                      <span className="summary-label">Total Income</span>
                      <span className="summary-value income">
                        {formatAmount(uploadResult.data.summary.total_income)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Total Expenses</span>
                      <span className="summary-value expense">
                        {formatAmount(uploadResult.data.summary.total_expenses)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Net Cash Flow</span>
                      <span className={`summary-value ${
                        uploadResult.data.summary.net_flow >= 0 ? 'income' : 'expense'
                      }`}>
                        {formatAmount(uploadResult.data.summary.net_flow)}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Transactions</span>
                      <span className="summary-value neutral">
                        {uploadResult.data.summary.transaction_count}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transactions Preview */}
              {uploadResult.data?.transactions && uploadResult.data.transactions.length > 0 && (
                <div className="transactions-preview">
                  <h3>Recent Transactions</h3>
                  <div className="transactions-list">
                    {uploadResult.data.transactions.slice(0, 5).map((transaction, index) => (
                      <div key={index} className="transaction-preview-item">
                        <div className="transaction-icon">
                          {transaction.type === 'credit' ? (
                            <TrendingUp size={16} className="credit" />
                          ) : (
                            <TrendingUp size={16} className="debit" />
                          )}
                        </div>
                        <div className="transaction-details">
                          <span className="transaction-description">
                            {transaction.description}
                          </span>
                          <span className="transaction-category">
                            {transaction.category}
                          </span>
                        </div>
                        <div className={`transaction-amount ${transaction.type}`}>
                          {transaction.type === 'credit' ? '+' : '-'}
                          {formatAmount(transaction.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                  {uploadResult.data.transactions.length > 5 && (
                    <p className="more-transactions">
                      +{uploadResult.data.transactions.length - 5} more transactions
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="analysis-actions">
                {!uploadResult.transactions_saved && (
                  <button 
                    className="btn-primary" 
                    onClick={handleSaveTransactions}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner size={16} />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={20} />
                        Save to Profile
                      </>
                    )}
                  </button>
                )}
                
                <button className="btn-secondary" onClick={handleViewFullAnalysis}>
                  <Eye size={20} />
                  View All Transactions
                </button>
                
                <button className="btn-outline" onClick={handleExportReport}>
                  <Download size={20} />
                  Export Report
                </button>
              </div>
            </div>
          )}

          {/* Instructions */}
          {!uploadResult && !uploading && (
            <div className="instructions-card">
              <h3>How it works</h3>
              <div className="instructions-list">
                <div className="instruction-item">
                  <div className="instruction-step">1</div>
                  <div className="instruction-content">
                    <strong>Upload PDF</strong>
                    <p>Upload your bank statement in PDF format</p>
                  </div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-step">2</div>
                  <div className="instruction-content">
                    <strong>AI Analysis</strong>
                    <p>Our AI extracts and categorizes transactions</p>
                  </div>
                </div>
                <div className="instruction-item">
                  <div className="instruction-step">3</div>
                  <div className="instruction-content">
                    <strong>Save to Profile</strong>
                    <p>Save extracted transactions to your financial profile</p>
                  </div>
                </div>
              </div>

              <div className="supported-banks">
                <h4>Supported Banks</h4>
                <div className="banks-list">
                  <span>Karnataka Bank</span>
                  <span>HDFC Bank</span>
                  <span>ICICI Bank</span>
                  <span>SBI</span>
                  <span>Axis Bank</span>
                  <span>Other Standard Formats</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions Modal */}
        {showTransactions && uploadResult?.data?.transactions && (
          <div className="transactions-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>All Transactions</h2>
                <button className="close-button" onClick={handleCloseTransactions}>
                  ×
                </button>
              </div>
              <div className="transactions-full-list">
                {uploadResult.data.transactions.map((transaction, index) => (
                  <div key={index} className="transaction-full-item">
                    <div className="transaction-icon">
                      {transaction.type === 'credit' ? (
                        <TrendingUp size={16} className="credit" />
                      ) : (
                        <TrendingUp size={16} className="debit" />
                      )}
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-date">
                        {transaction.date}
                      </span>
                      <span className="transaction-description">
                        {transaction.description}
                      </span>
                      <span className="transaction-category">
                        {transaction.category}
                      </span>
                    </div>
                    <div className={`transaction-amount ${transaction.type}`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                      {formatAmount(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BankStatementUpload;