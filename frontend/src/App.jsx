import { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  TrendingDown,
  Edit2,
  Trash2,
  RefreshCw,
  Sprout,
  FileSpreadsheet
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const API_URL = '/api';

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary, setSummary] = useState({ expense: 0 });
  const [categoryStats, setCategoryStats] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('expenses');
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    type: 'expense',
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Filter state
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
        type: 'expense'
      });

      const [summaryRes, transactionsRes, categoriesRes, categoryStatsRes, monthlyStatsRes] = await Promise.all([
        fetch(`${API_URL}/summary?${params}`),
        fetch(`${API_URL}/transactions?${params}`),
        fetch(`${API_URL}/categories?type=expense`),
        fetch(`${API_URL}/stats/by-category?${params}&type=expense`),
        fetch(`${API_URL}/stats/monthly?year=${new Date().getFullYear()}`)
      ]);

      const summaryData = await summaryRes.json();
      const transactionsData = await transactionsRes.json();
      const categoriesData = await categoriesRes.json();
      const categoryStatsData = await categoryStatsRes.json();
      const monthlyStatsData = await monthlyStatsRes.json();

      setSummary(summaryData);
      setTransactions(transactionsData);
      setCategories(categoriesData);
      setCategoryStats(categoryStatsData);
      setMonthlyStats(processMonthlyStats(monthlyStatsData));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  const processMonthlyStats = (data) => {
    const months = {};
    data.filter(item => item.type === 'expense').forEach(item => {
      months[item.month] = { month: item.month, expense: item.total };
    });
    return Object.values(months);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `${API_URL}/transactions/${formData.id}` 
        : `${API_URL}/transactions`;

      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    setFormData({
      id: transaction.id,
      type: 'expense',
      category_id: transaction.category_id || '',
      amount: transaction.amount,
      description: transaction.description || '',
      date: transaction.date
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    
    try {
      await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams({
      startDate: dateRange.start,
      endDate: dateRange.end
    });
    
    window.location.href = `${API_URL}/export/csv?${params}`;
  };

  const handleSendToLine = async () => {
    try {
      const response = await fetch(`${API_URL}/line/daily-summary`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ ส่งสรุปรายจ่ายไปไลน์แล้ว!');
      } else {
        alert('ℹ️ ' + (data.message || 'ไม่มีรายจ่ายวันนี้'));
      }
    } catch (error) {
      console.error('Error sending to LINE:', error);
      alert('❌ ไม่สามารถส่งไปไลน์ได้ กรุณาตรวจสอบ LINE_NOTIFY_TOKEN');
    }
  };

  const resetForm = () => {
    setFormData({
      id: null,
      type: 'expense',
      category_id: '',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const COLORS = ['#ef4444', '#f59e0b', '#06b6d4', '#ec4899', '#6366f1', '#8b5cf6', '#14b8a6', '#f97316', '#a855f7', '#64748b'];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '24px',
        color: '#ef4444'
      }}>
        <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '1400px', 
      margin: '0 auto', 
      padding: '20px',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        color: 'white',
        boxShadow: '0 10px 30px rgba(220, 38, 38, 0.3)',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
          <Sprout size={48} />
          <div>
            <h1 style={{ fontSize: '36px', marginBottom: '5px', fontWeight: '700' }}>
              บัญชีรายจ่ายสวน
            </h1>
            <p style={{ opacity: 0.9, fontSize: '16px' }}>
              ระบบบันทึกค่าใช้จ่ายของสวน
            </p>
          </div>
        </div>
      </header>

      {/* Summary Card */}
      <div style={{ marginBottom: '30px' }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          border: '3px solid #fee2e2',
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div style={{ flex: 1 }}>
              <div style={{ 
                color: '#6b7280', 
                fontSize: '16px', 
                fontWeight: '500',
                marginBottom: '8px' 
              }}>
                รายจ่ายทั้งหมด
              </div>
              <div style={{ 
                fontSize: '42px', 
                fontWeight: '700', 
                color: '#ef4444',
                fontFamily: 'Kanit'
              }}>
                {formatCurrency(summary.expense || 0)}
              </div>
              <div style={{ 
                fontSize: '14px', 
                color: '#6b7280',
                marginTop: '8px'
              }}>
                {dateRange.start && dateRange.end && (
                  <>ช่วงวันที่ {new Date(dateRange.start).toLocaleDateString('th-TH', { day: '2-digit', month: 'short' })} - {new Date(dateRange.end).toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' })}</>
                )}
              </div>
            </div>
            <div style={{ 
              background: '#fee2e2',
              borderRadius: '15px',
              padding: '20px',
              color: '#ef4444'
            }}>
              <TrendingDown size={48} />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '20px',
        flexWrap: 'wrap'
      }}>
        <TabButton 
          active={activeTab === 'expenses'} 
          onClick={() => setActiveTab('expenses')}
        >
          📝 รายการค่าใช้จ่าย
        </TabButton>
        <TabButton 
          active={activeTab === 'charts'} 
          onClick={() => setActiveTab('charts')}
        >
          📊 กราฟวิเคราะห์
        </TabButton>
      </div>

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          {/* Filters and Buttons */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '15px'
          }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                style={{
                  padding: '10px 15px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px'
                }}
              />

              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                style={{
                  padding: '10px 15px',
                  borderRadius: '10px',
                  border: '2px solid #e5e7eb',
                  fontSize: '15px'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                onClick={handleExportCSV}
                style={{
                  background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <FileSpreadsheet size={20} />
                Export Excel
              </button>

              <button
                onClick={handleSendToLine}
                style={{
                  background: 'linear-gradient(135deg, #06c755 0%, #00b900 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(0, 185, 0, 0.3)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                💬 ส่งสรุปไปไลน์
              </button>

              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                style={{
                  background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <PlusCircle size={20} />
                เพิ่มรายจ่าย
              </button>
            </div>
          </div>

          {/* Transaction Form Modal */}
          {showForm && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
              animation: 'fadeIn 0.2s ease'
            }}>
              <div style={{
                background: 'white',
                borderRadius: '20px',
                padding: '30px',
                width: '90%',
                maxWidth: '500px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                animation: 'fadeIn 0.3s ease'
              }}>
                <h2 style={{ marginBottom: '20px', fontSize: '24px' }}>
                  {formData.id ? 'แก้ไขรายจ่าย' : 'เพิ่มรายจ่ายใหม่'}
                </h2>

                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      หมวดหมู่ *
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '15px'
                      }}
                      required
                    >
                      <option value="">เลือกหมวดหมู่</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      จำนวนเงิน (บาท) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '15px'
                      }}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      รายละเอียด
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '15px',
                        minHeight: '80px',
                        resize: 'vertical'
                      }}
                      placeholder="ระบุรายละเอียดเพิ่มเติม..."
                    />
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                      วันที่ *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '10px',
                        border: '2px solid #e5e7eb',
                        fontSize: '15px'
                      }}
                      required
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="submit"
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      บันทึก
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); resetForm(); }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#e5e7eb',
                        color: '#374151',
                        fontSize: '16px',
                        fontWeight: '500'
                      }}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          <Card>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ 
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    borderBottom: '2px solid #d1d5db'
                  }}>
                    <th style={{ padding: '15px', textAlign: 'left' }}>วันที่</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>หมวดหมู่</th>
                    <th style={{ padding: '15px', textAlign: 'left' }}>รายละเอียด</th>
                    <th style={{ padding: '15px', textAlign: 'right' }}>จำนวนเงิน</th>
                    <th style={{ padding: '15px', textAlign: 'center' }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr 
                      key={t.id} 
                      style={{ 
                        borderBottom: '1px solid #e5e7eb',
                        animation: `slideIn ${0.1 + idx * 0.05}s ease`
                      }}
                    >
                      <td style={{ padding: '15px' }}>
                        {new Date(t.date).toLocaleDateString('th-TH', { 
                          day: '2-digit', 
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td style={{ padding: '15px' }}>
                        <span style={{
                          display: 'inline-block',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: t.category_color || '#6b7280',
                          marginRight: '8px'
                        }} />
                        {t.category_name || '-'}
                      </td>
                      <td style={{ padding: '15px', color: '#6b7280' }}>
                        {t.description || '-'}
                      </td>
                      <td style={{ 
                        padding: '15px', 
                        textAlign: 'right',
                        fontWeight: '600',
                        fontSize: '16px',
                        color: '#ef4444'
                      }}>
                        {formatCurrency(t.amount)}
                      </td>
                      <td style={{ padding: '15px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEdit(t)}
                          style={{
                            background: '#3b82f6',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            marginRight: '8px',
                            fontSize: '14px'
                          }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '14px'
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {transactions.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '40px', 
                  color: '#9ca3af' 
                }}>
                  ยังไม่มีรายการในช่วงเวลานี้
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Charts Tab */}
      {activeTab === 'charts' && (
        <div style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Category Pie Chart */}
            <Card title="สัดส่วนรายจ่ายตามหมวดหมู่">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={categoryStats}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={(entry) => `${entry.name}: ${formatCurrency(entry.total)}`}
                    >
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  ยังไม่มีข้อมูล
                </p>
              )}
            </Card>

            {/* Category Bar Chart */}
            <Card title="รายจ่ายแยกตามหมวดหมู่">
              {categoryStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                    <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Bar dataKey="total" name="ยอดรวม">
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                  ยังไม่มีข้อมูล
                </p>
              )}
            </Card>
          </div>

          {/* Monthly Line Chart */}
          <Card title="กราฟรายจ่ายรายเดือน">
            {monthlyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return `${parseInt(month)}/${year}`;
                    }}
                  />
                  <YAxis tickFormatter={(value) => `${value.toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelFormatter={(label) => `เดือน ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#ef4444" 
                    strokeWidth={3}
                    name="รายจ่าย"
                    dot={{ fill: '#ef4444', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                ยังไม่มีข้อมูล
              </p>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// Component: Card
function Card({ title, children }) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '25px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
      animation: 'fadeIn 0.5s ease'
    }}>
      {title && (
        <h3 style={{ 
          fontSize: '20px', 
          marginBottom: '20px',
          color: '#1f2937',
          fontWeight: '600'
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

// Component: Tab Button
function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 24px',
        borderRadius: '12px',
        fontSize: '16px',
        fontWeight: '500',
        background: active 
          ? 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)' 
          : 'white',
        color: active ? 'white' : '#374151',
        boxShadow: active 
          ? '0 4px 12px rgba(220, 38, 38, 0.3)' 
          : '0 2px 8px rgba(0, 0, 0, 0.05)',
        border: active ? 'none' : '2px solid #e5e7eb'
      }}
    >
      {children}
    </button>
  );
}

export default App;
