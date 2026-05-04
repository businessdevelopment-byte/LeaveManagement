import React, { useState, useRef, useMemo, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  XCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  CheckCircle,
  ChevronDown,
  FileText,
  Save,
  MessageSquare,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const REQUEST_TYPES = ['Leave Request', 'WFH Request', 'Punchmiss Request', 'Weekoff Request'];

// Robust date formatter: handles YYYY/MM/DD, YYYY-MM-DD, ISO, timestamps
const formatUIDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || String(dateStr).trim() === '') return '-';
  const s = String(dateStr).trim();
  // Already DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;
  // YYYY/MM/DD or YYYY/MM/DD HH:MM:SS (Google Sheets format)
  const slashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[3]}/${slashMatch[2]}/${slashMatch[1]}`;
  // YYYY-MM-DD or ISO
  const dashMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (dashMatch) return `${dashMatch[3]}/${dashMatch[2]}/${dashMatch[1]}`;
  return s;
};

// Convert stored date string to YYYY-MM-DD for <input type="date" />
const toInputDate = (dateStr) => {
  if (!dateStr || dateStr === '-' || String(dateStr).trim() === '') return '';
  const s = String(dateStr).trim();
  // YYYY/MM/DD or YYYY/MM/DD HH:MM:SS
  const slashMatch = s.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
  if (slashMatch) return `${slashMatch[1]}-${slashMatch[2]}-${slashMatch[3]}`;
  // DD/MM/YYYY
  const ddMatch = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddMatch) return `${ddMatch[3]}-${ddMatch[2]}-${ddMatch[1]}`;
  // Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
};

export default function Approval() {
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const { user } = useAuthStore();

  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'
  const [selectedRows, setSelectedRows] = useState([]);
  const [draftStatuses, setDraftStatuses] = useState({});
  const [draftRemarks, setDraftRemarks] = useState({});
  const [draftDates, setDraftDates] = useState({}); // { id: { from, to, days } }
  const [bulkRemarks, setBulkRemarks] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [filters, setFilters] = useState({
    fromDate: '',
    toDate: '',
    name: '',
    type: '',
    manager: '',
    searchQuery: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchApprovalData = async () => {
    try {
      setIsInitialLoading(true);
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const res = await fetch(`${scriptUrl}?sheet=${import.meta.env.VITE_DATA_SHEET || 'Data'}`);
      const json = await res.json();

      if (json.success) {
        const rows = json.data.slice(1);
        const reqs = [];

        rows.forEach((r, idx) => {
          if (r[1] && String(r[1]).startsWith('SN-')) {
            // O = index 14, P = index 15
            const statusVal = String(r[17] || '').trim();

            const isPending = statusVal === '';
            const isHistory = statusVal !== '';

            if (isPending || isHistory) {
              reqs.push({
                id: String(r[0]) + String(r[1]),
                rowIndex: idx + 2, // 1 for header + 1 for array index
                timestamp: String(r[0] || ''),
                sn: String(r[1] || ''),
                type: String(r[2] || ''),
                employeeId: String(r[3] || ''),
                name: String(r[4] || ''),
                designation: String(r[5] || ''),
                mobile: String(r[6] || ''),
                from: String(r[7] || ''),
                to: String(r[8] || ''),
                days: String(r[9] || ''),
                manager: String(r[10] || ''),
                managerId: String(r[11] || ''),
                remarks: String(r[12] || ''),
                proofUrl: String(r[13] || ''),
                status: isPending ? 'PENDING' : String(r[17] || ''), // R = 17
                approverRemarks: String(r[19] || '') // T = 19
              });
            }
          }
        });
        setRequests(reqs.reverse());
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load data');
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovalData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, statusFilter]);

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'PENDING'), [requests]);
  const historyRequests = useMemo(() => requests.filter(r => r.status !== 'PENDING'), [requests]);

  const displayRequests = useMemo(() => {
    if (activeTab === 'pending') {
      return pendingRequests;
    }
    const history = historyRequests;
    if (statusFilter) {
      return history.filter(r => r.status === statusFilter);
    }
    return history;
  }, [activeTab, statusFilter, pendingRequests, historyRequests]);

  const filteredRequests = useMemo(() => {
    return displayRequests.filter(req => {
      if (filters.fromDate && req.from < filters.fromDate) return false;
      if (filters.toDate && req.from > filters.toDate) return false;
      if (filters.name && req.name !== filters.name) return false;
      if (filters.type && req.type !== filters.type) return false;
      if (filters.manager && req.manager !== filters.manager) return false;

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          req.sn.toLowerCase().includes(q) ||
          req.name.toLowerCase().includes(q) ||
          req.type.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [displayRequests, filters]);

  const sortedRequests = useMemo(() => [...filteredRequests].reverse(), [filteredRequests]);
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const paginatedRequests = useMemo(() => {
    return sortedRequests.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  }, [sortedRequests, currentPage, itemsPerPage]);

  const handleSelectAll = (e) => {
    const isChecked = e.target.checked;
    const pageIds = paginatedRequests.map(r => r.id);

    if (isChecked) {
      setSelectedRows(pageIds);
      const newDraftDates = {};
      paginatedRequests.forEach(r => {
        newDraftDates[r.id] = { from: r.from, to: r.to, days: r.days };
      });
      setDraftDates(newDraftDates);
    } else {
      setSelectedRows([]);
      setDraftStatuses({});
      setDraftRemarks({});
      setDraftDates({});
      setBulkRemarks('');
    }
  };

  const handleSelectRow = (id) => {
    const isSelected = selectedRows.includes(id);

    if (!isSelected) {
      // Selecting
      setSelectedRows(prev => [...prev, id]);
      const req = requests.find(r => r.id === id);
      if (req) {
        setDraftDates(prev => ({ ...prev, [id]: { from: req.from, to: req.to, days: req.days } }));
      }
    } else {
      // Unselecting
      setSelectedRows(prev => prev.filter(rowId => rowId !== id));

      setDraftStatuses(prev => { const next = { ...prev }; delete next[id]; return next; });
      setDraftRemarks(prev => { const next = { ...prev }; delete next[id]; return next; });
      setDraftDates(prev => { const next = { ...prev }; delete next[id]; return next; });

      if (selectedRows.length === 1) {
        setBulkRemarks('');
      }
    }
  };

  const handleSaveBulk = async () => {
    if (selectedRows.length === 0) {
      toast.error('Please select rows to update');
      return;
    }

    const missingStatuses = selectedRows.some(id => !draftStatuses[id]);
    if (missingStatuses) {
      toast.error('Please select an Approve/Reject status for all checked rows.');
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading('Saving approvals...');

    try {
      const scriptUrl = import.meta.env.VITE_GOOGLE_APPS_SCRIPT;
      const sheetName = import.meta.env.VITE_DATA_SHEET || 'Data';

      // 1. Fresh fetch to find correct rowIndex by matching ID
      const freshRes = await fetch(`${scriptUrl}?sheet=${sheetName}`);
      const freshJson = await freshRes.json();
      if (!freshJson.success) throw new Error('Failed to fetch latest data');
      const freshRows = freshJson.data;

      const now = new Date();
      const pad = (n) => n.toString().padStart(2, '0');
      const timestamp = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;



      const updatesToPerform = [];
      for (const id of selectedRows) {
        // ID = Timestamp + SN
        let correctRowIndex = -1;
        for (let i = 1; i < freshRows.length; i++) {
          const rowId = String(freshRows[i][0]) + String(freshRows[i][1]);
          if (rowId === id) {
            correctRowIndex = i + 1;
            break;
          }
        }
        if (correctRowIndex === -1) continue;

        const status = draftStatuses[id];
        const remarks = draftRemarks[id] || bulkRemarks || '';

        const rowData = new Array(21).fill('');
        rowData[14] = "";
        rowData[15] = timestamp;
        rowData[17] = status;
        rowData[18] = user?.employeeCode || '';
        rowData[19] = remarks;
        rowData[20] = user?.name || '';



        updatesToPerform.push({ rowIndex: correctRowIndex, rowData });
      }

      for (const update of updatesToPerform) {
        const res = await fetch(scriptUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            action: 'update',
            sheetName: sheetName,
            rowIndex: update.rowIndex,
            rowData: JSON.stringify(update.rowData)
          })
        });
        const json = await res.json();
        if (!json.success) throw new Error(json.error);
      }

      toast.success(`${selectedRows.length} requests processed successfully!`, { id: toastId });

      setSelectedRows([]);
      setDraftStatuses({});
      setDraftRemarks({});
      setDraftDates({});
      setBulkRemarks('');

      await fetchApprovalData();

    } catch (err) {
      console.error(err);
      toast.error('Failed to save approvals', { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  // updateIndividualStatus and handleApproverRemarksChange are no longer needed
  // as we are using draft states and handleSaveBulk for all saving.

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 gap-4 overflow-y-auto overflow-x-hidden relative scrollbar-hide">

      {/* Header Row: Tabs + Filters */}
      <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col lg:flex-row items-start lg:items-center gap-3 shadow-sm">

        <div className="flex w-full lg:w-auto justify-between items-center gap-2">
          {/* Tabs - Segmented Style */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-md flex-shrink-0">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-1.5 px-3 font-bold transition text-[11px] uppercase tracking-wider rounded-md whitespace-nowrap ${activeTab === 'pending'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              Pending ({pendingRequests.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-3 font-bold transition text-[11px] uppercase tracking-wider rounded-md whitespace-nowrap ${activeTab === 'history'
                ? 'bg-white text-sky-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              History ({historyRequests.length})
            </button>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`flex items-center justify-center rounded-md shadow-sm h-[34px] w-[34px] flex-shrink-0 transition ${showMobileFilters ? 'bg-sky-100 text-sky-700 border border-sky-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Filter size={15} />
            </button>
            <button
              onClick={handleSaveBulk}
              disabled={selectedRows.length === 0 || isSaving}
              className="bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center rounded-md h-[34px] w-[34px] shadow-sm flex-shrink-0 transition-colors disabled:opacity-50"
            >
              {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={15} />}
            </button>
          </div>
        </div>

        <div className="flex w-full lg:w-auto gap-2 items-center flex-1">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Name, Serial No..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-md focus:outline-none focus:border-sky-500 text-sm h-[38px]"
            />
          </div>


        </div>

        {/* Filters */}
        <div className={`${showMobileFilters ? 'grid' : 'hidden'} lg:flex grid-cols-2 lg:flex-row gap-2 w-full lg:w-auto items-center`}>
          <input
            type="text"
            placeholder="From Date"
            onFocus={(e) => (e.target.type = 'date')}
            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
            className="w-full lg:w-40 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          />
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="w-full lg:w-48 px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-500 h-[38px]"
          >
            <option value="">All Types</option>
            {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {activeTab === 'history' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full lg:w-48 px-3 py-2 border border-sky-200 bg-sky-50 text-sky-700 font-bold rounded-md text-sm focus:outline-none h-[38px] col-span-2 lg:col-span-1"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          )}
        </div>

        {/* Only One Button: SAVE Desktop */}
        <button
          onClick={handleSaveBulk}
          disabled={selectedRows.length === 0 || isSaving}
          className="hidden lg:flex bg-[#0284c7] hover:bg-[#0369a1] text-white px-8 py-2 h-[38px] rounded-md font-black text-sm items-center justify-center gap-2 whitespace-nowrap shadow-sm uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
          {isSaving ? 'SAVING...' : 'SAVE'}
        </button>
      </div>

      {/* Data Section */}
      <div className="bg-white rounded-lg border border-slate-200 flex-1 flex flex-col overflow-hidden shadow-sm">

        {isInitialLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50 min-h-[400px]">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-bold text-slate-700 uppercase tracking-wide">Loading......</p>
          </div>
        ) : (
          <>
            {/* Mobile View: Cards */}
            <div className="md:hidden flex flex-col gap-2 p-2 overflow-y-auto flex-1 bg-slate-50/50">
              {paginatedRequests.map((req) => (
                <div key={req.id} className={`bg-white rounded-lg border shadow-sm p-3 flex flex-col gap-2 relative transition-all ${selectedRows.includes(req.id) ? 'border-sky-300 ring-1 ring-sky-200 bg-sky-50/10' : 'border-slate-200'}`}>

                  <div className="flex justify-between items-center bg-slate-50 -mx-3 -mt-3 px-3 py-2 border-b border-slate-100 rounded-t-lg">
                    <div className="flex items-center gap-2">
                      {activeTab === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(req.id)}
                          onChange={() => handleSelectRow(req.id)}
                          className="w-3.5 h-3.5 rounded text-sky-600 border-slate-300"
                        />
                      )}
                      <span className="text-[12px] font-bold text-sky-600">{req.sn}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] tracking-widest uppercase border ${req.type === 'Leave Request' ? 'bg-orange-50 text-orange-600 border-orange-200' :
                        req.type === 'WFH Request' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                          req.type === 'Punchmiss Request' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                        {req.type.split(' ')[0]}
                      </span>
                      {activeTab === 'pending' && (
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(req.id)}
                          onChange={() => handleSelectRow(req.id)}
                          className="w-6 h-6 rounded text-sky-600 focus:ring-sky-500 border-slate-300 shadow-sm cursor-pointer"
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-start mt-1">
                    <div>
                      <h3 className="text-[13px] font-bold text-slate-700 uppercase">{req.name}</h3>
                      <p className="text-[11px] text-slate-500">{req.designation}</p>
                    </div>
                    {activeTab === 'history' && (
                      <span className={`px-2 py-0.5 rounded-[4px] text-[9px] font-bold uppercase tracking-wider border ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'
                        }`}>
                        {req.status}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-2 bg-slate-50 p-2 rounded border border-slate-100">
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">From</p>
                      {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                        <div className="relative w-full h-[24px]">
                          <div className="absolute inset-0 flex items-center px-1.5 border border-sky-300 rounded bg-white overflow-hidden pointer-events-none">
                            <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">{formatUIDate(draftDates[req.id]?.from) || 'DD/MM/YYYY'}</span>
                          </div>
                          <input
                            type="date"
                            value={toInputDate(draftDates[req.id]?.from)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const formatted = val ? val.split('-').reverse().join('/') : '';
                              setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], from: formatted } }));
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          />
                        </div>
                      ) : <p className="text-[11px] font-medium text-slate-700">{formatUIDate(req.from)}</p>}
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">To</p>
                      {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                        <div className="relative w-full h-[24px]">
                          <div className="absolute inset-0 flex items-center px-1.5 border border-sky-300 rounded bg-white overflow-hidden pointer-events-none">
                            <span className="text-[11px] font-medium text-slate-700 whitespace-nowrap">{formatUIDate(draftDates[req.id]?.to) || 'DD/MM/YYYY'}</span>
                          </div>
                          <input
                            type="date"
                            value={toInputDate(draftDates[req.id]?.to)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const formatted = val ? val.split('-').reverse().join('/') : '';
                              setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], to: formatted } }));
                            }}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          />
                        </div>
                      ) : <p className="text-[11px] font-medium text-slate-700">{formatUIDate(req.to)}</p>}
                    </div>
                    <div>
                      <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Days</p>
                      {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                        <input
                          type="text"
                          value={draftDates[req.id]?.days || ''}
                          onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], days: e.target.value } }))}
                          className="w-full text-[11px] h-[24px] text-center px-1 border border-sky-300 rounded focus:outline-none focus:border-sky-500 bg-white"
                        />
                      ) : <p className="text-[11px] font-bold text-sky-600">{req.days}</p>}
                    </div>
                  </div>

                  <div className="mt-1">
                    <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Req Remarks</p>
                    <p className="text-[11px] text-slate-600 italic truncate">{req.remarks}</p>
                  </div>

                  {/* Approver Action Area */}
                  <div className="mt-1 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                    {activeTab === 'pending' ? (
                      <div className="flex gap-2">
                        <div className="w-1/3">
                          <select
                            value={draftStatuses[req.id] || ''}
                            onChange={(e) => setDraftStatuses(prev => ({ ...prev, [req.id]: e.target.value }))}
                            disabled={!selectedRows.includes(req.id)}
                            className={`w-full text-[10px] uppercase tracking-wider border rounded p-1.5 focus:outline-none ${selectedRows.includes(req.id) ? 'border-sky-300 bg-white text-slate-700' : 'border-slate-100 bg-slate-50 opacity-60 text-slate-400'}`}
                          >
                            <option value="">Status</option>
                            <option value="APPROVED" className="text-emerald-600 font-bold">Approve</option>
                            <option value="REJECTED" className="text-rose-600 font-bold">Reject</option>
                          </select>
                        </div>
                        <div className="w-2/3">
                          <input
                            type="text"
                            placeholder="Approver remarks..."
                            value={draftRemarks[req.id] !== undefined ? draftRemarks[req.id] : req.approverRemarks}
                            onChange={(e) => setDraftRemarks(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className={`w-full text-[11px] border rounded p-1.5 focus:outline-none ${selectedRows.includes(req.id) ? 'border-sky-300 bg-white text-slate-700' : 'border-slate-100 bg-slate-50 opacity-60 text-slate-400'}`}
                            disabled={!selectedRows.includes(req.id)}
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-[8px] text-slate-400 uppercase tracking-wider mb-0.5">Approver Remarks</p>
                        <p className="text-[11px] text-slate-600 italic">{req.approverRemarks || '-'}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredRequests.length === 0 && (
                <div className="p-4 text-center text-slate-500 bg-white rounded-lg border border-slate-100 shadow-sm text-sm">
                  No requests found.
                </div>
              )}
            </div>

            {/* Desktop View: Table */}
            <div className="hidden md:block overflow-x-auto flex-1 scrollbar-hide">
              <table className="w-full border-collapse">
                <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    {activeTab === 'pending' && (
                      <th className="px-4 py-3 text-center w-10 whitespace-nowrap border-r border-slate-100">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Action</span>
                          <input
                            type="checkbox"
                            onChange={handleSelectAll}
                            checked={paginatedRequests.length > 0 && selectedRows.length === paginatedRequests.length}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                          />
                        </div>
                      </th>
                    )}
                    <th className="px-4 py-3 text-center min-w-[120px] whitespace-nowrap">
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Status</span>
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap min-w-[180px]">Approver Remarks</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Serial No</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Request Type</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Name</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Designation</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Mobile No</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">From</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">To</th>
                    <th className="px-4 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Days</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Remarks</th>
                    <th className="px-4 py-3 text-center text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Proof</th>
                    <th className="px-4 py-3 text-left text-[11px] font-black text-slate-700 uppercase tracking-widest whitespace-nowrap">Manager</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRequests.map((req) => (
                    <tr key={req.id} className={`hover:bg-slate-50 transition-colors ${selectedRows.includes(req.id) ? 'bg-sky-50/50' : ''}`}>
                      {activeTab === 'pending' && (
                        <td className="px-4 py-3 text-center whitespace-nowrap border-r border-slate-100">
                          <input
                            type="checkbox"
                            checked={selectedRows.includes(req.id)}
                            onChange={() => handleSelectRow(req.id)}
                            className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                          />
                        </td>
                      )}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {activeTab === 'pending' ? (
                          <select
                            value={draftStatuses[req.id] || ''}
                            onChange={(e) => setDraftStatuses(prev => ({ ...prev, [req.id]: e.target.value }))}
                            disabled={!selectedRows.includes(req.id)}
                            className={`text-[10px] uppercase tracking-wider border rounded px-2 py-1 focus:outline-none transition-all ${selectedRows.includes(req.id)
                              ? 'border-sky-200 bg-white focus:border-sky-500 cursor-pointer text-slate-700'
                              : 'border-slate-100 bg-slate-50 opacity-60 cursor-not-allowed text-slate-400'
                              }`}
                          >
                            <option value="">Select</option>
                            <option value="APPROVED" className="text-emerald-600 font-bold">Approve</option>
                            <option value="REJECTED" className="text-rose-600 font-bold">Reject</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase tracking-wider inline-flex items-center justify-center gap-1 ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-rose-100 text-rose-700 border border-rose-200'
                            }`}>
                            {req.status}
                          </span>
                        )}
                      </td>
                      {/* Approver Remarks column data moved here */}
                      <td className="px-4 py-3 whitespace-nowrap min-w-[180px]">
                        {activeTab === 'pending' ? (
                          <input
                            type="text"
                            placeholder="Add remarks..."
                            value={draftRemarks[req.id] !== undefined ? draftRemarks[req.id] : req.approverRemarks}
                            onChange={(e) => setDraftRemarks(prev => ({ ...prev, [req.id]: e.target.value }))}
                            className={`text-[11px] border rounded px-2 py-1 w-full focus:outline-none transition-all ${selectedRows.includes(req.id) ? 'border-sky-200 bg-white focus:border-sky-500 shadow-sm' : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'}`}
                            disabled={!selectedRows.includes(req.id)}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-600 italic">{req.approverRemarks || '-'}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-sky-600 hover:underline cursor-pointer whitespace-nowrap">{req.sn}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-[10px] text-slate-500 uppercase tracking-tighter">{req.type}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 uppercase whitespace-nowrap">{req.name}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{req.designation}</td>
                      <td className="px-4 py-3 text-[11px] text-slate-500 whitespace-nowrap">{req.mobile}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                          <input
                            type="date"
                            value={toInputDate(draftDates[req.id]?.from)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const formatted = val ? val.split('-').reverse().join('/') : '';
                              setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], from: formatted } }));
                            }}
                            className="w-[110px] px-2 py-1 text-[11px] border border-sky-200 rounded focus:outline-none focus:border-sky-500 bg-white"
                          />
                        ) : formatUIDate(req.from)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                          <input
                            type="date"
                            value={toInputDate(draftDates[req.id]?.to)}
                            onChange={(e) => {
                              const val = e.target.value;
                              const formatted = val ? val.split('-').reverse().join('/') : '';
                              setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], to: formatted } }));
                            }}
                            className="w-[110px] px-2 py-1 text-[11px] border border-sky-200 rounded focus:outline-none focus:border-sky-500 bg-white"
                          />
                        ) : formatUIDate(req.to)}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-sky-600 whitespace-nowrap">
                        {activeTab === 'pending' && selectedRows.includes(req.id) ? (
                          <input
                            type="text"
                            value={draftDates[req.id]?.days || ''}
                            onChange={(e) => setDraftDates(prev => ({ ...prev, [req.id]: { ...prev[req.id], days: e.target.value } }))}
                            className="w-12 px-2 py-1 text-[11px] text-center border border-sky-200 rounded focus:outline-none focus:border-sky-500 bg-white"
                          />
                        ) : req.days}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 italic max-w-xs truncate whitespace-nowrap">{req.remarks}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {req.proofUrl ? (
                          <button 
                            onClick={() => setPreviewUrl(req.proofUrl)} 
                            className="inline-flex items-center justify-center p-1.5 bg-sky-50 text-sky-600 rounded-md hover:bg-sky-100 transition-colors"
                          >
                            <FileText size={14} />
                          </button>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{req.manager}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-2 border-t border-slate-200 bg-[#f8fafc] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="bg-white border border-slate-200 rounded px-1.5 py-1 text-xs font-bold shadow-sm"
                >
                  {[10, 15, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                <span className="text-[12px] font-bold text-slate-500">
                  {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedRequests.length)} of {sortedRequests.length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 text-sky-600 shadow-sm"
                >
                  <ChevronLeft size={16} strokeWidth={3} />
                </button>
                <span className="mx-2 text-[12px] font-bold text-slate-600">Pg {currentPage}/{totalPages || 1}</span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-1 border border-slate-200 rounded bg-white disabled:opacity-30 text-sky-600 shadow-sm"
                >
                  <ChevronRight size={16} strokeWidth={3} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {/* Attachment Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Proof Attachment</h3>
                <p className="text-xs text-slate-500">Document preview</p>
              </div>
              <button onClick={() => setPreviewUrl(null)} className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 bg-slate-50 p-6 flex items-center justify-center min-h-[300px] max-h-[70vh] overflow-y-auto">
              <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 w-full max-w-md">
                <div className="rounded-lg border-2 border-dashed border-slate-200 p-4 flex flex-col items-center justify-center bg-slate-50/50">
                  <img
                    src={previewUrl}
                    className="max-w-full h-auto rounded-lg shadow-md mb-4"
                    alt="Proof"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/400x300?text=Preview+Error';
                    }}
                  />
                  <div className="flex gap-3 w-full">
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-sm font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <ExternalLink size={14} /> Full View
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
