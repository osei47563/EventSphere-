import React, { useState } from 'react';
import {
  Wallet,
  ArrowUpRight,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  Send,
  CreditCard,
  Lock,
  FileText,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/paystack';
import { WithdrawalAccount } from '../../types';
import { DashboardNav } from '../common/DashboardNav';

export const OrganizerWallet: React.FC = () => {
  const {
    organization,
    walletStats,
    withdrawalRequests,
    requestWithdrawal,
    updateWithdrawalAccount,
  } = useApp();

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isEditAccountOpen, setIsEditAccountOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number>(
    Math.min(walletStats.withdrawableBalance, 25000)
  );

  // Bank Account Edit state
  const [bankName, setBankName] = useState(organization.withdrawalAccount?.bankName || 'JPMorgan Chase / Stanbic IBTC');
  const [accountNumber, setAccountNumber] = useState(organization.withdrawalAccount?.accountNumber || '9928104829');
  const [accountName, setAccountName] = useState(organization.withdrawalAccount?.accountName || 'Apex Global Conferences & Media Ltd');
  const [routingCode, setRoutingCode] = useState(organization.withdrawalAccount?.routingOrSwiftCode || 'CHASUS33');

  const orgWithdrawals = withdrawalRequests.filter((w) => w.organizationId === organization.id);

  const walletTabs = [
    { id: 'balance', label: 'Settlement & Balance', icon: Wallet },
    { id: 'payouts', label: `Payout Records (${orgWithdrawals.length})`, icon: ArrowUpRight },
  ];

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (withdrawAmount <= 0) {
      alert('Please enter a valid withdrawal amount.');
      return;
    }
    if (withdrawAmount > walletStats.withdrawableBalance) {
      alert(`Amount exceeds your available withdrawable balance of ${formatCurrency(walletStats.withdrawableBalance, organization.currency)}.`);
      return;
    }

    const currentAccount: WithdrawalAccount = organization.withdrawalAccount || {
      bankName,
      accountNumber,
      accountName,
      routingOrSwiftCode: routingCode,
      currency: organization.currency,
    };

    requestWithdrawal(withdrawAmount, currentAccount);
    setIsRequestModalOpen(false);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    updateWithdrawalAccount({
      bankName,
      accountNumber,
      accountName,
      routingOrSwiftCode: routingCode,
      currency: organization.currency,
    });
    setIsEditAccountOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] pb-24 sm:pb-12 text-[#334155]">
      <DashboardNav
        title="Revenue & Payouts"
        subtitle={`Available: ${formatCurrency(walletStats.withdrawableBalance, organization.currency)} · Paystack Live Settlement`}
        tabs={walletTabs}
        activeTab="balance"
        onSelectTab={() => {}}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Wallet Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Organizer Revenue & Payouts
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Commission: {organization.platformCommissionRate}%
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Wallet & Settlement Payouts</h1>
            <p className="text-xs text-slate-500">
              Direct Paystack merchant revenue, platform fee deductions, and wire withdrawals to your verified corporate bank account.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditAccountOpen(true)}
              className="px-3.5 py-2 text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md transition-colors"
            >
              Payout Bank Account
            </button>
            <button
              onClick={() => {
                setWithdrawAmount(Math.min(walletStats.withdrawableBalance, 25000));
                setIsRequestModalOpen(true);
              }}
              disabled={walletStats.withdrawableBalance <= 0}
              className={`px-4 py-2 text-xs font-semibold rounded-md shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                walletStats.withdrawableBalance > 0
                  ? 'bg-slate-900 hover:bg-slate-800 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              <span>Request Payout</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500">Gross Ticket Sales</span>
            <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatCurrency(walletStats.grossRevenue, organization.currency)}
            </div>
            <span className="text-[11px] text-slate-400">Total processed volume</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500">Platform Commission ({walletStats.commissionRate}%)</span>
            <div className="text-2xl font-bold text-rose-600 font-mono tabular-nums">
              -{formatCurrency(walletStats.platformCommissionFee, organization.currency)}
            </div>
            <span className="text-[11px] text-slate-400">Configured by system admin</span>
          </div>

          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-1">
            <span className="text-xs font-semibold text-emerald-900">Available Withdrawable</span>
            <div className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {formatCurrency(walletStats.withdrawableBalance, organization.currency)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">Ready for immediate transfer</span>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <span className="text-xs text-slate-500">Total Settled Payouts</span>
            <div className="text-2xl font-bold text-slate-800 font-mono tabular-nums">
              {formatCurrency(walletStats.totalWithdrawn, organization.currency)}
            </div>
            <span className="text-[11px] text-slate-400">
              Pending: {formatCurrency(walletStats.pendingWithdrawn, organization.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Verified Bank Account Details Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-600" />
            <h3 className="font-bold text-slate-900 text-sm">Settlement Payout Destination</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Verified Bank Rail
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Bank Name</span>
            <span className="font-semibold text-slate-800">{organization.withdrawalAccount?.bankName || 'Not Set'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Number</span>
            <span className="font-mono font-semibold text-slate-800">{organization.withdrawalAccount?.accountNumber || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Account Beneficiary</span>
            <span className="font-semibold text-slate-800">{organization.withdrawalAccount?.accountName || '—'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Swift / Routing Code</span>
            <span className="font-mono text-slate-800">{organization.withdrawalAccount?.routingOrSwiftCode || '—'}</span>
          </div>
        </div>
      </div>

      {/* Historical Payout Ledger */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">Withdrawal Payout Requests & Status</h3>
            <p className="text-xs text-slate-500">Live transaction lifecycle monitored and authorized by administrator</p>
          </div>
          <span className="text-xs font-mono text-slate-500">{orgWithdrawals.length} transactions</span>
        </div>

        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Payout Ref</th>
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Gross Request</th>
                <th className="py-3 px-4">Platform Fee</th>
                <th className="py-3 px-4">Net Payout</th>
                <th className="py-3 px-4">Bank Destination</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Admin Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
              {orgWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">
                    No withdrawal payout requests submitted yet.
                  </td>
                </tr>
              ) : (
                orgWithdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">{w.reference}</td>
                    <td className="py-3 px-4 text-slate-500 font-sans whitespace-nowrap">
                      {new Date(w.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {formatCurrency(w.amount, w.currency)}
                    </td>
                    <td className="py-3 px-4 text-rose-600">
                      -{formatCurrency(w.platformCommissionFee, w.currency)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-700">
                      {formatCurrency(w.netPayoutAmount, w.currency)}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      <div>{w.bankAccount.bankName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {w.bankAccount.accountNumber}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-sans">
                      {w.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          Settled
                        </span>
                      )}
                      {w.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Reviewing
                        </span>
                      )}
                      {w.status === 'processing' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-800">
                          <Clock className="w-3 h-3 text-blue-600" />
                          Processing
                        </span>
                      )}
                      {w.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Declined
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-500 max-w-xs truncate">
                      {w.adminNotes || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Request Payout Modal */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm">Request Settlement Payout</h3>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleWithdrawalSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Withdrawal Amount ({organization.currency}) *</label>
                <input
                  type="number"
                  min={100}
                  max={walletStats.withdrawableBalance}
                  step={50}
                  required
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                  className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-900 focus:outline-hidden focus:border-slate-900 focus:bg-white"
                />
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Available: {formatCurrency(walletStats.withdrawableBalance, organization.currency)}</span>
                  <button
                    type="button"
                    onClick={() => setWithdrawAmount(walletStats.withdrawableBalance)}
                    className="text-emerald-700 hover:underline font-medium"
                  >
                    Withdraw All Max
                  </button>
                </div>
              </div>

              {/* Commission calculation preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-600 font-sans">
                  <span>Platform Commission ({walletStats.commissionRate}%):</span>
                  <span>-{formatCurrency(Math.round(withdrawAmount * (walletStats.commissionRate / 100) * 100) / 100, organization.currency)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 text-sm border-t border-slate-200 pt-1.5">
                  <span className="font-sans">Net Payout to Bank:</span>
                  <span className="text-emerald-700 font-bold">
                    {formatCurrency(
                      Math.max(0, Math.round((withdrawAmount - withdrawAmount * (walletStats.commissionRate / 100)) * 100) / 100),
                      organization.currency
                    )}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-1 text-xs">
                <span className="font-medium text-slate-700 block">Bank Settlement Account:</span>
                <p className="text-slate-600">
                  {organization.withdrawalAccount?.bankName} · {organization.withdrawalAccount?.accountNumber} ({organization.withdrawalAccount?.accountName})
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Payout Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Bank Account Modal */}
      {isEditAccountOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm">Payout Bank Account Details</h3>
              </div>
              <button
                onClick={() => setIsEditAccountOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Bank Name *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Standard Chartered / Stanbic IBTC"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Account Number / IBAN *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 0123456789 or GB29X..."
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Account Beneficiary Name *</label>
                <input
                  type="text"
                  required
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. Apex Global Conferences & Media Ltd"
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Swift / BIC / Routing Code</label>
                <input
                  type="text"
                  value={routingCode}
                  onChange={(e) => setRoutingCode(e.target.value)}
                  placeholder="e.g. SCBLNG22"
                  className="w-full text-xs font-mono bg-slate-50 border border-slate-300 rounded-md py-2 px-3 text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditAccountOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  Save Account Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);
};
