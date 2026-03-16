'use client'

import { useState, useCallback } from 'react'
import { DollarSign, Plus, AlertCircle } from 'lucide-react'
import { MotionFadeIn, MotionStagger, MotionStaggerItem } from '@/components/nebula/motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { OfferRow, OfferStatus, OfferType } from '@/lib/supabase/types'
import { useOffers, useCreateOffer, useRevenueStats } from '../hooks'
import type { CreateOfferInput } from '../hooks/use-create-offer'
import { OfferCard } from './OfferCard'
import { OfferForm } from './OfferForm'
import { OfferFilters } from './OfferFilters'
import { PricingLadder } from './PricingLadder'
import { CTABuilder } from './CTABuilder'
import { OfferStats } from './OfferStats'
import { RevenueSimulator } from './RevenueSimulator'

interface RevenueLabPageProps {
  workspaceId: string
}

type ActiveTab = 'library' | 'ladder' | 'cta' | 'simulator'

const TABS: { id: ActiveTab; label: string }[] = [
  { id: 'library', label: 'Library' },
  { id: 'ladder', label: 'Pricing Ladder' },
  { id: 'cta', label: 'CTA Builder' },
  { id: 'simulator', label: 'Simulator' },
]

function SkeletonRow() {
  return (
    <div className="animate-pulse bg-[var(--surface-elevated)] rounded h-14 mx-5 my-1.5" />
  )
}

export function RevenueLabPage({ workspaceId }: RevenueLabPageProps) {
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editingOffer, setEditingOffer] = useState<OfferRow | null>(null)
  const [selectedOffer, setSelectedOffer] = useState<OfferRow | null>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>('library')
  const [dailyRuns, setDailyRuns] = useState(16)
  const [monthlyLeads, setMonthlyLeads] = useState(240)

  const { offers, count, isLoading, error, refresh } = useOffers({
    workspaceId,
    status: statusFilter !== 'all' ? (statusFilter as OfferStatus) : undefined,
    offerType: typeFilter !== 'all' ? (typeFilter as OfferType) : undefined,
  })
  const { create, isCreating } = useCreateOffer()
  const { stats, isLoading: statsLoading } = useRevenueStats(workspaceId)

  const handleCreate = useCallback(
    async (data: CreateOfferInput) => {
      await create(workspaceId, data)
      refresh()
      setShowForm(false)
    },
    [create, workspaceId, refresh],
  )

  const handleUpdate = useCallback(
    async (data: CreateOfferInput) => {
      if (!editingOffer) return
      await fetch(`/api/offers/${editingOffer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      refresh()
      setEditingOffer(null)
    },
    [editingOffer, refresh],
  )

  const handleDelete = useCallback(
    async (offer: OfferRow) => {
      if (!confirm('Delete this offer?')) return
      await fetch(`/api/offers/${offer.id}`, { method: 'DELETE' })
      refresh()
      if (selectedOffer?.id === offer.id) setSelectedOffer(null)
    },
    [refresh, selectedOffer],
  )

  const formOpen = showForm || editingOffer !== null

  return (
    <div className="space-y-6 p-6 md:p-8">
      {/* Header */}
      <MotionFadeIn>
        <div className="flex items-center justify-end gap-2">
          <Button
            onClick={() => setShowForm(true)}
            className={cn(
              'flex items-center gap-2',
              'bg-[var(--primary)] text-white',
              'hover:opacity-90 transition-opacity',
            )}
          >
            <Plus size={15} />
            New Offer
          </Button>
        </div>
      </MotionFadeIn>

      {/* Stats bar */}
      <MotionFadeIn delay={0.05}>
        <OfferStats stats={stats} isLoading={statsLoading} />
      </MotionFadeIn>

      {/* Tab nav */}
      <MotionFadeIn delay={0.1}>
        <div className="flex items-center gap-0 border-b border-[var(--border)]">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2.5 text-sm font-medium transition-colors duration-100',
                'border-b-2 -mb-px',
                activeTab === tab.id
                  ? 'text-[var(--text)] border-[var(--primary)]'
                  : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </MotionFadeIn>

      {/* Tab content */}
      {activeTab === 'library' && (
        <MotionFadeIn>
          <div className="space-y-3">
            <OfferFilters
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onStatusChange={setStatusFilter}
              onTypeChange={setTypeFilter}
            />

            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Offer Library</CardTitle>
                  <Badge variant="muted">{count} offers</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0 pb-3">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : error ? (
                  <div className="flex items-center gap-2.5 px-5 py-6 text-[var(--danger)]">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                ) : offers.length === 0 ? (
                  <div
                    className={cn(
                      'flex flex-col items-center gap-4 py-14 px-6 text-center',
                    )}
                  >
                    <div
                      className="flex items-center justify-center w-14 h-14 rounded-[var(--radius-xl)]"
                      style={{
                        background: 'rgba(245,158,11,0.12)',
                        border: '1px solid rgba(245,158,11,0.3)',
                      }}
                    >
                      <DollarSign size={24} className="text-[var(--warning)]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text)] mb-1">
                        No offers yet
                      </p>
                      <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto leading-relaxed">
                        Create your first offer to start building your revenue engine
                      </p>
                    </div>
                    <Button
                      onClick={() => setShowForm(true)}
                      className={cn(
                        'flex items-center gap-2 text-sm',
                        'bg-[var(--primary)] text-white hover:opacity-90 transition-opacity',
                      )}
                    >
                      <Plus size={14} />
                      Create Offer
                    </Button>
                  </div>
                ) : (
                  <MotionStagger className="divide-y divide-[var(--border-subtle)]">
                    {offers.map((offer) => (
                      <MotionStaggerItem key={offer.id}>
                        <OfferCard
                          offer={offer}
                          onEdit={setEditingOffer}
                          onDelete={handleDelete}
                          onSelect={setSelectedOffer}
                          selected={selectedOffer?.id === offer.id}
                        />
                      </MotionStaggerItem>
                    ))}
                  </MotionStagger>
                )}
              </CardContent>
            </Card>
          </div>
        </MotionFadeIn>
      )}

      {activeTab === 'ladder' && (
        <MotionFadeIn>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Pricing Ladder</CardTitle>
            </CardHeader>
            <CardContent>
              <PricingLadder offers={offers} onOfferClick={setSelectedOffer} />
            </CardContent>
          </Card>
        </MotionFadeIn>
      )}

      {activeTab === 'cta' && (
        <MotionFadeIn>
          {selectedOffer ? (
            <CTABuilder offer={selectedOffer} workspaceId={workspaceId} />
          ) : (
            <div className="text-center p-12">
              <p className="text-[var(--text-muted)] text-sm">
                Select an offer from the Library tab to build CTAs
              </p>
            </div>
          )}
        </MotionFadeIn>
      )}

      {activeTab === 'simulator' && (
        <MotionFadeIn>
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <RevenueSimulator
              dailyRuns={dailyRuns}
              onDailyRunsChange={setDailyRuns}
              monthlyLeads={monthlyLeads}
              onMonthlyLeadsChange={setMonthlyLeads}
              offers={offers}
            />
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Offer Stack</CardTitle>
                  <Badge variant="muted">{count} offers</Badge>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Click an offer to spotlight it. Revenue projections use your active offers.
                </p>
              </CardHeader>
              <CardContent className="p-0 pb-3">
                {isLoading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : offers.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-[var(--text-muted)]">
                    Create offers in the Library tab to populate the simulator
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)]">
                    {offers.map((offer) => (
                      <OfferCard
                        key={offer.id}
                        offer={offer}
                        onSelect={setSelectedOffer}
                        selected={selectedOffer?.id === offer.id}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </MotionFadeIn>
      )}

      {/* Offer form modal */}
      {formOpen && (
        <OfferForm
          offer={editingOffer ?? undefined}
          workspaceId={workspaceId}
          isSubmitting={isCreating}
          onSubmit={editingOffer ? handleUpdate : handleCreate}
          onClose={() => {
            setShowForm(false)
            setEditingOffer(null)
          }}
        />
      )}
    </div>
  )
}
