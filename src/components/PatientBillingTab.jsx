import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FiCreditCard,
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiSave,
  FiX,
} from '../icons/hugeicons-feather';
import {
  INVOICE_FREQUENCIES,
  createEmptyInvoiceForm,
  deletePatientInvoice,
  fetchPatientInvoices,
  formatBillingMoney,
  invoiceFormFromRecord,
  refreshPatientInvoicesAfterMutation,
  resolvePatientBillingRouteId,
  savePatientInvoice,
  summarizeBillingRecords,
} from '../utils/patientBilling';
import './PatientBillingTab.css';

export default function PatientBillingTab({
  patientId,
  patientName,
  patientRecord,
  profileLoading = false,
}) {
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
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [recordForm, setRecordForm] = useState(() => createEmptyInvoiceForm());

  const billingUuid = useMemo(
    () => resolvePatientBillingRouteId(patientId, patientRecord),
    [patientId, patientRecord],
  );

  const applyRecords = useCallback((rows) => {
    setRecords(rows.map((row) => ({
      ...row,
      patientName: row.patientName || patientName || 'Patient',
    })));
  }, [patientName]);

  const loadBilling = useCallback(async () => {
    if (!billingUuid) {
      setRecords([]);
      setLoading(Boolean(profileLoading));
      setLoaded(!profileLoading);
      setError(
        profileLoading
          ? ''
          : 'Patient UUID is required to load billing. Refresh the profile and try again.',
      );
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await fetchPatientInvoices(billingUuid, { patientRecord });
      applyRecords(data.records);
    } catch (err) {
      setError(err?.message || 'Unable to load billing information.');
      setRecords([]);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  }, [billingUuid, patientRecord, profileLoading, applyRecords]);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const wasProfileLoadingRef = useRef(profileLoading);
  useEffect(() => {
    if (wasProfileLoadingRef.current && !profileLoading && billingUuid) {
      loadBilling();
    }
    wasProfileLoadingRef.current = profileLoading;
  }, [profileLoading, billingUuid, loadBilling]);

  useEffect(() => {
    if (!success) return undefined;
    const timer = window.setTimeout(() => setSuccess(''), 3200);
    return () => window.clearTimeout(timer);
  }, [success]);

  const summary = useMemo(() => summarizeBillingRecords(records), [records]);
  const currency = records[0]?.currency || 'GHS';

  const openRecordForm = useCallback(() => {
    if (records.length >= 1) {
      setEditingRecordId(records[0].id);
      setRecordForm(invoiceFormFromRecord(records[0]));
      setFormError('');
      setShowRecordForm(true);
      return;
    }
    setFormError('');
    setEditingRecordId('');
    setRecordForm(createEmptyInvoiceForm());
    setShowRecordForm(true);
  }, [records]);

  const resetRecordForm = useCallback(() => {
    setRecordForm(createEmptyInvoiceForm());
    setEditingRecordId('');
    setFormError('');
    setShowRecordForm(false);
  }, []);

  useEffect(() => {
    if (!showRecordForm && !deleteTarget) return undefined;
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (showRecordForm && !savingRecord) resetRecordForm();
      if (deleteTarget && !deletingRecordId) setDeleteTarget(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showRecordForm, deleteTarget, savingRecord, deletingRecordId, resetRecordForm]);

  const handleSaveRecord = async () => {
    const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
    if (!billingUuid) {
      setFormError('Patient UUID is required for billing. Wait for the profile to finish loading.');
      return;
    }

    if (!Number.isFinite(Number(recordForm.rate)) || Number(recordForm.rate) <= 0) {
      setFormError('Enter a valid rate greater than zero.');
      return;
    }
    if (!String(recordForm.note || '').trim()) {
      setFormError('Note is required.');
      return;
    }

    setSavingRecord(true);
    setFormError('');
    setError('');
    setSuccess('');
    try {
      const existingId = editingRecordId || undefined;
      const saved = await savePatientInvoice(billingUuid, recordForm, {
        invoiceId: existingId,
        patientRecord,
      });
      const refreshed = await refreshPatientInvoicesAfterMutation(billingUuid, { patientRecord });
      const nextRecords = refreshed.length ? refreshed : (saved ? [saved] : []);
      applyRecords(nextRecords);
      resetRecordForm();
      setSuccess(existingId || records.length ? 'Billing entry updated.' : 'Billing entry saved.');
    } catch (err) {
      setFormError(err?.message || 'Failed to save billing entry.');
    } finally {
      setSavingRecord(false);
    }
  };

  const startEditRecord = (record) => {
    setEditingRecordId(record.id);
    setRecordForm(invoiceFormFromRecord(record));
    setShowRecordForm(true);
    setFormError('');
    setError('');
    setSuccess('');
  };

  const handleConfirmDelete = async () => {
    const billingUuid = resolvePatientBillingRouteId(patientId, patientRecord);
    if (!billingUuid || !deleteTarget) return;

    setDeletingRecordId(billingUuid);
    setError('');
    setSuccess('');
    try {
      const nextRecords = await deletePatientInvoice(billingUuid, { patientRecord });
      applyRecords(nextRecords);
      if (editingRecordId) resetRecordForm();
      setDeleteTarget(null);
      setSuccess('Billing record deleted.');
    } catch (err) {
      setError(err?.message || 'Failed to delete billing record.');
    } finally {
      setDeletingRecordId('');
    }
  };

  if ((loading && !loaded) || (profileLoading && !billingUuid)) {
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
            Record and track billing rates for {patientName || 'this patient'}.
          </p>
        </div>
        <button
          type="button"
          className="patient-billing__btn patient-billing__btn--primary patient-billing__btn--add"
          onClick={openRecordForm}
        >
          <FiPlus size={15} aria-hidden />
          {records.length ? 'Edit billing entry' : 'Add billing entry'}
        </button>
      </header>

      <div className="patient-billing__summary-grid patient-billing__summary-grid--compact">
        <div className="patient-billing__summary-card">
          <span className="patient-billing__summary-label">Entries</span>
          <strong className="patient-billing__summary-value">{summary.count}</strong>
        </div>
        <div className="patient-billing__summary-card">
          <span className="patient-billing__summary-label">Combined rate</span>
          <strong className="patient-billing__summary-value">{formatBillingMoney(summary.billed, currency)}</strong>
        </div>
      </div>

      {!!error && <div className="patient-billing__alert patient-billing__alert--error" role="alert">{error}</div>}
      {!!success && <div className="patient-billing__alert patient-billing__alert--success" role="status">{success}</div>}

      {records.length > 0 && (
        <div className="patient-billing__current" aria-label="Current billing">
          <div className="patient-billing__current-label">Current billing</div>
          <div className="patient-billing__current-grid">
            <div className="patient-billing__current-item">
              <span>Rate</span>
              <strong>{formatBillingMoney(records[0].rate, records[0].currency || currency)}</strong>
            </div>
            <div className="patient-billing__current-item">
              <span>Frequency</span>
              <strong>{records[0].frequencyLabel || records[0].frequency}</strong>
            </div>
            <div className="patient-billing__current-item patient-billing__current-item--wide">
              <span>Note</span>
              <strong>{records[0].note || '—'}</strong>
            </div>
          </div>
        </div>
      )}

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
                  <label className="patient-billing__label" htmlFor="billing-invoice-rate">Rate</label>
                  <input
                    id="billing-invoice-rate"
                    type="number"
                    min="0"
                    step="0.01"
                    className="patient-billing__input"
                    value={recordForm.rate}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, rate: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div className="patient-billing__field">
                  <label className="patient-billing__label" htmlFor="billing-invoice-frequency">Frequency</label>
                  <select
                    id="billing-invoice-frequency"
                    className="patient-billing__select"
                    value={recordForm.frequency}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, frequency: e.target.value }))}
                  >
                    {INVOICE_FREQUENCIES.map((entry) => (
                      <option key={entry.value} value={entry.value}>{entry.label}</option>
                    ))}
                  </select>
                </div>
                <div className="patient-billing__field patient-billing__field--full">
                  <label className="patient-billing__label" htmlFor="billing-invoice-note">Note</label>
                  <textarea
                    id="billing-invoice-note"
                    className="patient-billing__textarea"
                    value={recordForm.note}
                    onChange={(e) => setRecordForm((prev) => ({ ...prev, note: e.target.value }))}
                    placeholder="Home care rate"
                    rows={3}
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

      {deleteTarget && (
        <div
          className="patient-billing-modal-overlay"
          role="presentation"
          onClick={() => { if (!deletingRecordId) setDeleteTarget(null); }}
        >
          <div
            className="patient-billing-modal patient-billing-modal--confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="patient-billing-delete-title"
            aria-describedby="patient-billing-delete-desc"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="patient-billing-delete">
              <div className="patient-billing-delete__icon" aria-hidden>
                <FiTrash2 size={24} />
              </div>
              <h3 id="patient-billing-delete-title" className="patient-billing-delete__title">
                Delete billing entry?
              </h3>
              <p id="patient-billing-delete-desc" className="patient-billing-delete__lead">
                This will permanently remove the billing record for {patientName || 'this patient'}. This action cannot be undone.
              </p>
              <div className="patient-billing-delete__summary">
                <div className="patient-billing-delete__summary-row">
                  <span>Rate</span>
                  <strong>{formatBillingMoney(deleteTarget.rate, deleteTarget.currency || currency)}</strong>
                </div>
                <div className="patient-billing-delete__summary-row">
                  <span>Frequency</span>
                  <strong>{deleteTarget.frequencyLabel || deleteTarget.frequency}</strong>
                </div>
                {deleteTarget.note && (
                  <div className="patient-billing-delete__summary-row">
                    <span>Note</span>
                    <strong>{deleteTarget.note}</strong>
                  </div>
                )}
              </div>
              <div className="patient-billing-delete__actions">
                <button
                  type="button"
                  className="patient-billing__btn patient-billing__btn--secondary"
                  onClick={() => setDeleteTarget(null)}
                  disabled={Boolean(deletingRecordId)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="patient-billing__btn patient-billing__btn--danger"
                  onClick={handleConfirmDelete}
                  disabled={Boolean(deletingRecordId)}
                >
                  <FiTrash2 size={14} aria-hidden />
                  {deletingRecordId ? 'Deleting…' : 'Delete entry'}
                </button>
              </div>
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
            </p>
          </div>
          <button
            type="button"
            className="patient-billing__btn patient-billing__btn--ghost"
            onClick={loadBilling}
            disabled={loading}
            title="Refresh billing"
          >
            <FiRefreshCw size={14} aria-hidden />
            Refresh
          </button>
        </div>
        {records.length === 0 ? (
          <div className="patient-billing__empty">
            <div className="patient-billing__empty-icon" aria-hidden>
              <FiCreditCard size={24} />
            </div>
            <div className="patient-billing__empty-title">No billing entries yet</div>
            <p className="patient-billing__empty-text">
              Add a rate with frequency and note for this patient.
            </p>
          </div>
        ) : (
          <div className="patient-billing__table-wrap">
            <table className="patient-billing__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rate</th>
                  <th>Frequency</th>
                  <th>Note</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>{record.displayDate}</td>
                    <td className="patient-billing__amount">
                      {formatBillingMoney(record.rate, record.currency || currency)}
                    </td>
                    <td>{record.frequencyLabel || record.frequency}</td>
                    <td>{record.note || '—'}</td>
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
                          onClick={() => setDeleteTarget(record)}
                          disabled={Boolean(deletingRecordId)}
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
