import { useMemo, useState } from 'react';
import { AlertTriangle, Package, Plus, Wallet } from 'lucide-react';
import { useBarbershopRuntime } from '../hooks/useBarbershopRuntime';
import { useBarbershopContext } from '../contexts/BarbershopContext';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/format';
import { emitAppDataChanged } from '../lib/events';

const initialForm = {
  name: '',
  brand: '',
  category: '',
  quantity: '0',
  minQuantity: '5',
  unit: 'un',
  costPrice: '',
  sellPrice: '',
};

const Estoque = () => {
  const { barbershop } = useBarbershopContext();
  const { stockItems, loading, error } = useBarbershopRuntime();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const lowStockCount = stockItems.filter((item) => item.quantity <= item.minQuantity).length;
  const totalInventoryValue = stockItems.reduce((total, item) => total + item.quantity * (item.costPrice ?? 0), 0);
  const activeItems = stockItems.filter((item) => item.isActive);

  const sortedItems = useMemo(
    () => [...stockItems].sort((left, right) => Number(right.quantity <= right.minQuantity) - Number(left.quantity <= left.minQuantity)),
    [stockItems],
  );

  const handleSubmit = async () => {
    if (!barbershop?.id) {
      setSubmitError('Nenhuma barbearia ativa encontrada.');
      return;
    }

    if (!form.name.trim()) {
      setSubmitError('Informe o nome do item.');
      return;
    }

    setSaving(true);
    setSubmitError(null);

    const { error: insertError } = await supabase.from('StockItem').insert({
      barbershopId: barbershop.id,
      name: form.name.trim(),
      brand: form.brand.trim() || null,
      category: form.category.trim() || null,
      quantity: Number(form.quantity || 0),
      minQuantity: Number(form.minQuantity || 0),
      unit: form.unit.trim() || 'un',
      costPrice: form.costPrice ? Number(form.costPrice.replace(',', '.')) : null,
      sellPrice: form.sellPrice ? Number(form.sellPrice.replace(',', '.')) : null,
      isActive: true,
    });

    setSaving(false);

    if (insertError) {
      setSubmitError(insertError.message);
      return;
    }

    setForm(initialForm);
    setShowForm(false);
    emitAppDataChanged('stock-item-created');
  };

  return (
    <div className="space-y-8 pt-8 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">Estoque</h1>
          <p className="mt-2 text-on-surface-variant">Itens e produtos reais da operação, sem placeholders no runtime.</p>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="flex items-center gap-2 rounded-xl bg-[#C8FF00] px-6 py-3 font-extrabold text-[#4f6700]"
        >
          <Plus size={20} />
          {showForm ? 'Fechar cadastro' : 'Novo Produto'}
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="Itens ativos" value={String(activeItems.length)} helper="Produtos disponiveis no catalogo" icon={<Package size={22} />} />
        <MetricCard label="Estoque critico" value={String(lowStockCount)} helper="Itens abaixo do minimo" icon={<AlertTriangle size={22} />} />
        <MetricCard label="Valor em custo" value={formatCurrency(totalInventoryValue)} helper="Capital imobilizado no estoque" icon={<Wallet size={22} />} />
      </div>

      {showForm && (
        <div className="glass-card rounded-3xl border border-white/5 p-6">
          <h2 className="text-xl font-bold text-white">Cadastrar item</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input label="Nome" value={form.name} onChange={(value) => setForm((current) => ({ ...current, name: value }))} />
            <Input label="Marca" value={form.brand} onChange={(value) => setForm((current) => ({ ...current, brand: value }))} />
            <Input label="Categoria" value={form.category} onChange={(value) => setForm((current) => ({ ...current, category: value }))} />
            <Input label="Unidade" value={form.unit} onChange={(value) => setForm((current) => ({ ...current, unit: value }))} />
            <Input label="Quantidade" value={form.quantity} onChange={(value) => setForm((current) => ({ ...current, quantity: value }))} />
            <Input label="Minimo" value={form.minQuantity} onChange={(value) => setForm((current) => ({ ...current, minQuantity: value }))} />
            <Input label="Custo" value={form.costPrice} onChange={(value) => setForm((current) => ({ ...current, costPrice: value }))} />
            <Input label="Venda" value={form.sellPrice} onChange={(value) => setForm((current) => ({ ...current, sellPrice: value }))} />
          </div>
          {submitError && <p className="mt-4 text-sm text-red-300">{submitError}</p>}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-xl bg-[#C8FF00] px-6 py-3 font-black text-[#4f6700] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar item'}
            </button>
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden rounded-3xl border border-white/5">
        {loading ? (
          <div className="p-8 text-center text-on-surface-variant">Carregando estoque...</div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-white">Nao foi possivel carregar o estoque</p>
            <p className="mt-2 text-sm text-on-surface-variant">{error}</p>
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-lg font-bold text-white">Nenhum item cadastrado</p>
            <p className="mt-2 text-sm text-on-surface-variant">Use o cadastro acima para registrar os primeiros produtos e insumos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse text-left">
              <thead>
                <tr className="bg-[rgba(32,31,31,0.3)]">
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Produto</th>
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Categoria</th>
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Quantidade</th>
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Custo</th>
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Venda</th>
                  <th className="border-b border-white/5 px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sortedItems.map((item) => {
                  const lowStock = item.quantity <= item.minQuantity;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-xs text-on-surface-variant">{item.brand || 'Sem marca'} {item.sku ? `• ${item.sku}` : ''}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-on-surface-variant">{item.category || 'Geral'}</td>
                      <td className="px-6 py-4 text-sm text-white">
                        {item.quantity} {item.unit || 'un'}
                      </td>
                      <td className="px-6 py-4 text-sm text-white">{item.costPrice != null ? formatCurrency(item.costPrice) : '—'}</td>
                      <td className="px-6 py-4 text-sm font-bold text-[#C8FF00]">{item.sellPrice != null ? formatCurrency(item.sellPrice) : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${lowStock ? 'bg-red-500/10 text-red-300' : 'bg-[#C8FF00]/10 text-[#C8FF00]'}`}>
                          {lowStock ? 'Baixo' : 'Saudavel'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard = ({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) => (
  <div className="glass-card rounded-3xl border border-white/5 p-6">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#C8FF00]/10 text-[#C8FF00]">{icon}</div>
    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</p>
    <p className="mt-2 text-3xl font-black text-white">{value}</p>
    <p className="mt-2 text-xs text-on-surface-variant">{helper}</p>
  </div>
);

const Input = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <div>
    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-on-surface-variant">{label}</label>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full rounded-xl border border-white/10 bg-surface-container px-4 py-3 text-white outline-none transition-colors focus:border-[#C8FF00]"
    />
  </div>
);

export default Estoque;
