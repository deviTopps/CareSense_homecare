import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiTrash2,
  FiSave,
  FiX,
} from '../icons/hugeicons-feather';
import {
  BILLING_STATUSES,
  PAYMENT_METHODS,
  EMPTY_BILLING_PROFILE,
  createEmptyBillingRecordForm,
  fetchPatientBilling,
  savePatientBillingBundle,
  buildBillingRecordFromForm,
  summarizeBillingRecords,
  formatBillingMoney,
} from '../utils/patientBilling';
import './PatientBillingTab.css';

function statusBadgeClass(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'paid') return 'patient-billing__badge--paid';
  if (s === 'partial') return 'patient-billing__badge--partial';
  if (s === 'overdue') return 'patient-billing__badge--overdue';
  if (s === 'waived') return 'patient-billing__badge--waived';
  return 'patient-billing__badge--pending';
}

export default function PatientBillingTab({ patientId, patientName }) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [records, setRecords] = useState([]);
  const [savingRecord, setSavingRecord] = useState(false);
  const [deletingRecordId, setDeletingRecordId] = useState('');
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRecordForm, setShowRecordForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState('');
  const [recordForm, setRecordForm] = useState(() => createEmptyBillingRecordForm());
  const storedProfileRef = useRef({ ...EMPTY_BILLING_PROFILE });

  const loadBilling = useCallback(async () => {
    const pid = String(patientId || '').trim();
    if (!pid) {
      setRecords([]);
      setLoading(false);
      setLoaded(true);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchPatientBilling(pid);
      storedProfileRef.current = data.profile || { ...EMPTY_BILLING_PROFILE };
      setRecords(Array.isArray(data.records) ? data.records : []);
    } catch (err) {
      setError(err?.message || 'Unable to load billing information.');
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [patientId]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3200);
    return () => window.clearTimeout(timer);
  }, [success]);

  const summary = useMemo(() => summarizeBillingRecords(records), [records]);
  const currency = records[0]?.currency || 'GHS';

  const openRecordForm = useCallback(() => {
    setRecordForm(createEmptyBillingRecordForm({ currency }));
    setEditingRecordId('');
    setFormError('');
    setShowRecordForm(true);
  }, [currency]);

  const resetRecordForm = useCallback(() => {
    setRecordForm(createEmptyBillingRecordForm({ currency }));
    setEditingRecordId('');
    setFormError('');
    setShowRecordForm(false);
  }, [currency]);

  useEffect(() => {
    if (!showRecordForm) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !savingRecord) resetRecordForm();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showRecordForm, savingRecord, resetRecordForm]);

  const handleSaveRecord = async () => {
    const pid = String(patientId || '').trim();
    if (!pid) return;
    if (!recordForm.description.trim()) {
      setFormError('Description is required for a billing entry.');
      return;
    }
    if (!Number.isFinite(Number(recordForm.amount)) || Number(recordForm.amount) <= 0) {
      setFormError('Enter a valid amount greater than zero.');
      return;
    }

    setSavingRecord(true);
    setFormError('');
    setError('');
    setSuccess('');
    try {
      const nextRecord = buildBillingRecordFromForm(recordForm, {
        patientId: pid,
        recordId: editingRecordId || undefined,
      });

      const nextRecords = editingRecordId
        ? records.map((row) => (row.id === editingRecordId ? { ...row, ...nextRecord, id: editingRecordId } : row))
        : [nextRecord, ...records];

      const saved = await savePatientBillingBundle(pid, {
        profile: storedProfileRef.current,
        records: nextRecords,
      });
      setRecords(saved.records);
      resetRecordForm();
      setSuccess(editingRecordId ? 'Billing entry updated.' : 'Billing entry added.');
    } catch (err) {
      setFormError(err?.message || 'Failed to save billing entry.');
    } finally {
      setSavingRecord(false);
    }
  };

  const startEditRecord = (record) => {
    setEditingRecordId(record.id);
    setRecordForm({
      date: record.date || new Date().toISOString().slice(0, 10),
      description: record.description || '',
      amount: String(record.amount ?? ''),
      currency: record.currency || currency,
      status: record.status || 'Pending',
      paymentMethod: record.paymentMethod || '',
      referenceNumber: record.referenceNumber || '',
      notes: record.notes || '',
    });
    setShowRecordForm(true);
    setFormError('');
    setError('');
    setSuccess('');
  };

  const handleDeleteRecord = async (recordId) => {
    const pid = String(patientId || '').trim();
    if (!pid || !recordId) return;
    if (!window.confirm('Delete this billing entry? This cannot be undone.')) return;

    setDeletingRecordId(recordId);
    setError('');
    setSuccess('');
    try {
      const nextRecords = records.filter((row) => row.id !== recordId);
      const saved = await savePatientBillingBundle(pid, {
        profile: storedProfileRef.current,
        records: nextRecords,
      });
      setRecords(saved.records);
      if (editingRecordId === recordId) resetRecordForm();
      setSuccess('Billing entry deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete billing entry.');
    } finally {
      setDeletingRecordId('');
    }
  };

  if (loading && !loaded) {
    return (
      <div className="patient-billing-loading" role="status" aria-live="polite" aria-label="Loading billing">
        <span className="patient-billing-loading__spinner" aria-hidden />
        <span className="patient-billing-loading__text">Loading billing…</span>
      </div>
    );
  }

  return (
    <section className="patient-billing" aria-labelledby="patient-billing-title">
      <header className="patient-billing__hero">
        <div className="patient-billing__hero-text">
          <h2 id="patient-billing-title" className="patient-billing__title">Billing</h2>
          <p className="patient-billing__subtitle">
            Record and track all charges for {patientName || 'this patient'}.
          </p>
        </div>
        <button
          type="button"
          className="patient-billing__btn patient-billing__btn--primary patient-billing__btn--add"
          onClick={openRecordForm}
        >
          <FiPlus size={15} aria-hidden />
          Add billing entry
        </button>
      </header>

      {!!error && <div className="patient-billing__alert patient-billing__alert--error" role="alert">{error}</div>}
      {!!success && <div className="patient-billing__alert patient-billing__alert--success" role="status">{success}</div>}

      {showRecordForm && (
        <div
          className="patient-billing-modal-overlay"
          role="presentation"
          onClick={() => { if (!savingRecord) resetRecordForm(); }}
        >
          <div
            className="patient-billing-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patient-billing-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="patient-billing-modal__head">
              <div>
                <div className="patient-billing-modal__kicker">Billing</div>
                <h3 id="patient-billing-modal-title" className="patient-billing-modal__title">
                  {editingRecordId ? 'Edit billing entry' : 'New billing entry'}
                </h3>
              </div>
              <button
                type="button"
                className="patient-billing-modal__close"
                onClick={resetRecordForm}
                disabled={savingRecord}
                aria-label="Close"
              >
                <FiX size={18} />
              </button>
            </div>

            <div className="patient-billing-modal__body">
              {!!formError && (
                <div className="patient-billing__alert patient-billing__alert--error" role="alert">
                  {formError}
                </div>
              )}

              <div className="patient-billing__grid">
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-record-date">Date</label>
                  <input
                    id="billing-record-date"
                    type="date"
                    className="patient-billing__input"
                    value={recordForm.date}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, date: e.target.value }))}
                  />
                </div>
                <div className="patient-billing__field patient-billing__field--full">
                  <label className="patient-billing__label" htmlFor="billing-record-description">Description</label>
                  <input
                    id="billing-record-description"
                    className="patient-billing__input"
                    value={recordForm.description}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g. Home visit — wound dressing"
                  />
                </div>
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-record-amount">Amount</label>
                  <input
                    id="billing-record-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="patient-billing__input"
                    value={recordForm.amount}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-record-status">Status</label>
                  <select
                    id="billing-record-status"
                    className="patient-billing__select"
                    value={recordForm.status}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, status: e.target.value }))}
                  >
                    {BILLING_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-record-payment">Payment method</label>
                  <select
                    id="billing-record-payment"
                    className="patient-billing__select"
                    value={recordForm.paymentMethod}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                  >
                    <option value="">Not specified</option>
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-record-reference">Reference / invoice #</label>
                  <input
                    id="billing-record-reference"
                    className="patient-billing__input"
                    value={recordForm.referenceNumber}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="patient-billing__field patient-billing__field--full">
                  <label className="patient-billing__label" htmlFor="billing-record-notes">Notes</label>
                  <textarea
                    id="billing-record-notes"
                    className="patient-billing__textarea"
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional billing details"
                  />
                </div>
              </div>
            </div>

            <div className="patient-billing-modal__footer">
              <button type="button" className="patient-billing__btn patient-billing__btn--secondary" onClick={resetRecordForm} disabled={savingRecord}>
                Cancel
              </button>
              <button type="button" className="patient-billing__btn patient-billing__btn--primary" onClick={handleSaveRecord} disabled={savingRecord}>
                <FiSave size={14} aria-hidden />
                {savingRecord ? 'Saving…' : (editingRecordId ? 'Update entry' : 'Save entry')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="patient-billing__card">
        <div className="patient-billing__card-head">
          <div>
            <h3 className="patient-billing__card-title">Billing history</h3>
            <p className="patient-billing__card-desc">
              {records.length} {records.length === 1 ? 'entry' : 'entries'}
              {summary.openCount > 0 ? ` · ${summary.openCount} open` : ''}
            </p>
          </div>
        </div>
        {records.length === 0 ? (
          <div className="patient-billing__empty">
            <div className="patient-billing__empty-icon" aria-hidden>
              <FiCreditCard size={24} />
            </div>
            <div className="patient-billing__empty-title">No billing entries yet</div>
            <p className="patient-billing__empty-text">
              Add visits, supplies, assessments, and other charges to keep a complete billing record for this patient.
            </p>
          </div>
        ) : (
          <div className="patient-billing__table-wrap">
            <table className="patient-billing__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Reference</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.displayDate || record.date || '—'}</td>
                    <td>
                      <strong>{record.description}</strong>
                      {record.notes ? <div style={{ marginTop: 4, fontSize: 12, color: '#64748b' }}>{record.notes}</div> : null}
                    </td>
                    <td className="patient-billing__amount">{formatBillingMoney(record.amount, record.currency || currency)}</td>
                    <td>
                      <span className={`patient-billing__badge ${statusBadgeClass(record.status)}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.referenceNumber || '—'}</td>
                    <td>
                      <div className="patient-billing__row-actions">
                        <button
                          type="button"
                          className="patient-billing__icon-btn"
                          title="Edit entry"
                          onClick={() => startEditRecord(record)}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className="patient-billing__icon-btn patient-billing__icon-btn--danger"
                          title="Delete entry"
                          onClick={() => handleDeleteRecord(record.id)}
                          disabled={deletingRecordId === record.id}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
