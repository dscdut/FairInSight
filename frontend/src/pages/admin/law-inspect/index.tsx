// Trang admin "Kiểm tra & Nối luật" (read-only).
// Luồng: search luật (theo tên/số hiệu) → chọn 1 luật → hiện cây Điều/Khoản/Điểm →
// click 1 unit → hiện chi tiết + quan hệ 2 CHIỀU (gồm cạnh treo). Vòng này CHỈ XEM;
// nút sửa/nối sẽ gắn lên đúng khung này ở bước sau.
import { useEffect, useMemo, useRef, useState } from 'react'

import { Network, Search, FileText } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/core/lib/utils'
import { lawAiApi } from '@/core/services/law-ai.service'
import {
  lawInspectApi,
  type RelationItem,
  type UnitNode
} from '@/core/services/law-inspect.service'
import { type Law } from '@/models/types/law.type'

import { RelationPanel } from './components/relation-panel'
import { UnitTree } from './components/unit-tree'

export default function LawInspectPage() {
  // --- search luật ---
  const [allLaws, setAllLaws] = useState<Law[]>([])
  const [search, setSearch] = useState('')
  const [lawsLoading, setLawsLoading] = useState(true)

  // --- luật + cây đang chọn ---
  const [activeLaw, setActiveLaw] = useState<Law | null>(null)
  const [units, setUnits] = useState<UnitNode[]>([])
  const [treeLoading, setTreeLoading] = useState(false)

  // --- unit + quan hệ đang chọn ---
  const [activeUnit, setActiveUnit] = useState<UnitNode | null>(null)
  const [outgoing, setOutgoing] = useState<RelationItem[]>([])
  const [incoming, setIncoming] = useState<RelationItem[]>([])
  const [relLoading, setRelLoading] = useState(false)

  // tải hết danh sách luật 1 lần (tái dùng service hiện có) → search client-side tức thì.
  useEffect(() => {
    let cancelled = false
    lawAiApi
      .listAllLaws()
      .then((items) => {
        if (!cancelled) setAllLaws(items)
      })
      .catch((e) => console.error('Lỗi tải danh sách luật:', e))
      .finally(() => {
        if (!cancelled) setLawsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return allLaws.slice(0, 50)
    return allLaws
      .filter((l) => `${l.title} ${l.documentNumber}`.toLowerCase().includes(q))
      .slice(0, 50)
  }, [allLaws, search])

  // chọn 1 luật → tải cây units.
  const selectLaw = async (law: Law) => {
    setActiveLaw(law)
    setActiveUnit(null)
    setOutgoing([])
    setIncoming([])
    setUnits([])
    setTreeLoading(true)
    try {
      const res = await lawInspectApi.getUnits(law.id)
      setUnits(res.units)
    } catch (e) {
      console.error('Lỗi tải cây đơn vị:', e)
    } finally {
      setTreeLoading(false)
    }
  }

  // chống race: chỉ nhận kết quả relations của unit được click GẦN NHẤT.
  const relReqId = useRef(0)

  // chọn 1 unit → tải quan hệ 2 chiều.
  const selectUnit = async (unit: UnitNode) => {
    setActiveUnit(unit)
    setRelLoading(true)
    const myReq = ++relReqId.current
    try {
      const res = await lawInspectApi.getRelations(unit.id)
      if (myReq !== relReqId.current) return // có click mới hơn → bỏ kết quả cũ
      setOutgoing(res.outgoing)
      setIncoming(res.incoming)
    } catch (e) {
      console.error('Lỗi tải quan hệ:', e)
      if (myReq === relReqId.current) {
        setOutgoing([])
        setIncoming([])
      }
    } finally {
      if (myReq === relReqId.current) setRelLoading(false)
    }
  }

  return (
    // Chiều cao TRẦN theo viewport (khớp 140px của layout-main) để 3 cột scroll NỘI BỘ,
    // không đẩy cả trang dài ra. flex-1 không đủ vì layout cha chỉ min-h-screen (không
    // có height cố định) → min-h-0 không có gì để bám.
    <main className='p-4 flex flex-col gap-3 h-[calc(100vh-120px)] min-h-0 overflow-hidden'>
      <section className='shrink-0'>
        <span className='inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-white backdrop-blur-sm shadow-sm mb-3.5'>
          <Network className='w-3.5 h-3.5' />
          Tra cứu luật
        </span>
        <h1 className='text-h1 font-bold text-text-primary mb-2'>Tra cứu cấu trúc & quan hệ</h1>
        <p className='text-xs text-text-description font-semibold leading-relaxed'>
          Tìm văn bản → xem từng Điều/Khoản/Điểm → kiểm tra các quan hệ luật nối luật (2 chiều).
        </p>
      </section>

      {/* 3 cột: [danh sách luật] [cây Điều] [chi tiết + quan hệ] */}
      <section className='flex-1 grid grid-cols-12 gap-3 min-h-0 overflow-hidden'>
        {/* CỘT 1: search + danh sách luật */}
        <div className='col-span-3 flex flex-col border border-border-secondary rounded-2xl bg-background-primary overflow-hidden'>
          <div className='p-3 border-b border-border-secondary'>
            <Input
              icon={<Search className='w-4 h-4' />}
              placeholder='Tên luật hoặc số hiệu…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className='flex-1 overflow-auto'>
            {lawsLoading ? (
              <p className='text-xs text-text-tertiary p-4 text-center'>Đang tải danh sách…</p>
            ) : filtered.length === 0 ? (
              <p className='text-xs text-text-tertiary p-4 text-center'>Không tìm thấy văn bản.</p>
            ) : (
              filtered.map((law) => (
                <button
                  key={law.id}
                  onClick={() => selectLaw(law)}
                  className={cn(
                    'w-full text-left p-3 border-b border-border-secondary text-xs transition-colors',
                    activeLaw?.id === law.id
                      ? 'bg-primary/10'
                      : 'hover:bg-background-secondary'
                  )}
                >
                  <p className='font-semibold text-text-primary line-clamp-2'>{law.title}</p>
                  <p className='text-text-tertiary mt-0.5'>{law.documentNumber || '—'}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* CỘT 2: cây Điều */}
        <div className='col-span-4 flex flex-col border border-border-secondary rounded-2xl bg-background-primary overflow-hidden'>
          {!activeLaw ? (
            <div className='flex-1 flex flex-col items-center justify-center text-text-tertiary text-xs gap-2 p-6 text-center'>
              <FileText className='w-8 h-8 opacity-40' />
              Chọn một văn bản bên trái để xem cây Điều khoản.
            </div>
          ) : (
            <>
              <div className='p-3 border-b border-border-secondary'>
                <p className='text-xs font-bold text-text-primary line-clamp-1'>{activeLaw.title}</p>
                <p className='text-[11px] text-text-tertiary'>
                  {activeLaw.documentNumber} · {units.length} đơn vị
                </p>
              </div>
              <div className='flex-1 overflow-auto'>
                {treeLoading ? (
                  <p className='text-xs text-text-tertiary p-4 text-center'>Đang tải cây…</p>
                ) : (
                  <UnitTree units={units} selectedId={activeUnit?.id ?? null} onSelect={selectUnit} />
                )}
              </div>
            </>
          )}
        </div>

        {/* CỘT 3: chi tiết unit + quan hệ 2 chiều */}
        <div className='col-span-5 flex flex-col border border-border-secondary rounded-2xl bg-background-primary overflow-hidden'>
          <RelationPanel
            unit={activeUnit}
            outgoing={outgoing}
            incoming={incoming}
            loading={relLoading}
          />
        </div>
      </section>
    </main>
  )
}
