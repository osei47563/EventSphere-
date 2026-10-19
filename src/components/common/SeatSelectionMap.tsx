import React, { useState, useMemo } from 'react';
import {
  Users,
  Check,
  Info,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Utensils,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { TicketTier, Attendee, SeatItem, SeatLayoutType } from '../../types';

interface SeatSelectionMapProps {
  tier: TicketTier;
  attendees: Attendee[];
  selectedSeatId: string | null;
  onSelectSeat: (seat: { id: string; label: string; section: string }) => void;
  readOnly?: boolean;
}

export const SeatSelectionMap: React.FC<SeatSelectionMapProps> = ({
  tier,
  attendees,
  selectedSeatId,
  onSelectSeat,
  readOnly = false,
}) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeSectionFilter, setActiveSectionFilter] = useState<string>('all');
  const [hoveredSeat, setHoveredSeat] = useState<SeatItem | null>(null);
  const [layoutMode, setLayoutMode] = useState<SeatLayoutType>(
    tier.seatLayoutType || 'dinner_tables'
  );

  // Generate dinner tables configuration
  const dinnerTables = useMemo(() => {
    const tables = [
      { id: 'T1', name: 'Presidential Table 1', category: 'front_stage', seatsCount: 8, x: 180, y: 150 },
      { id: 'T2', name: 'Ambassador Table 2', category: 'front_stage', seatsCount: 8, x: 420, y: 150 },
      { id: 'T3', name: 'Venture & Capital Table 3', category: 'mid_tier', seatsCount: 8, x: 180, y: 350 },
      { id: 'T4', name: 'Keynote Speakers Table 4', category: 'mid_tier', seatsCount: 8, x: 420, y: 350 },
      { id: 'T5', name: 'Central Bank Rails Table 5', category: 'rear', seatsCount: 8, x: 180, y: 550 },
      { id: 'T6', name: 'Global Founders Table 6', category: 'rear', seatsCount: 8, x: 420, y: 550 },
    ];

    // Map occupied seats from attendees
    const occupiedMap = new Map<string, Attendee>();
    attendees.forEach((a) => {
      if (a.assignedSeat) {
        occupiedMap.set(a.assignedSeat.trim().toLowerCase(), a);
      }
    });

    return tables.map((t) => {
      const seats: SeatItem[] = [];
      const radius = 48; // distance of seats from table center

      for (let i = 1; i <= t.seatsCount; i++) {
        const angle = ((i - 1) * (360 / t.seatsCount) - 90) * (Math.PI / 180);
        const seatX = t.x + radius * Math.cos(angle);
        const seatY = t.y + radius * Math.sin(angle);
        const seatId = `${t.id}-S${i}`;
        const seatLabel = `${t.id === 'T1' ? 'Table 1' : t.id === 'T2' ? 'Table 2' : t.id === 'T3' ? 'Table 3' : t.id === 'T4' ? 'Table 4' : t.id === 'T5' ? 'Table 5' : 'Table 6'} · Seat ${i}`;

        const occupant = occupiedMap.get(seatLabel.toLowerCase());
        const isOccupied = !!occupant || (t.id === 'T1' && (i === 1 || i === 2)) || (t.id === 'T2' && i === 1);

        seats.push({
          id: seatId,
          label: seatLabel,
          section: t.name,
          status: isOccupied ? 'occupied' : 'available',
          tierId: tier.id,
          occupantName: occupant ? occupant.fullName : isOccupied ? 'Registered VIP Delegate' : undefined,
          occupantCompany: occupant ? occupant.company : isOccupied ? 'Executive Guest' : undefined,
        });
      }

      return {
        ...t,
        seats,
      };
    });
  }, [attendees, tier.id]);

  // Generate theater plenary rows configuration
  const theaterRows = useMemo(() => {
    const rowsConfig = [
      { row: 'Row A (Front Stage VIP)', seatsCount: 12, tierName: 'VIP Plenary Front' },
      { row: 'Row B (Executive Circle)', seatsCount: 14, tierName: 'VIP Plenary' },
      { row: 'Row C (Senior Delegates)', seatsCount: 16, tierName: 'Executive' },
      { row: 'Row D (Senior Delegates)', seatsCount: 16, tierName: 'Executive' },
      { row: 'Row E (General Plenary)', seatsCount: 18, tierName: 'Delegate' },
    ];

    const occupiedMap = new Map<string, Attendee>();
    attendees.forEach((a) => {
      if (a.assignedSeat) {
        occupiedMap.set(a.assignedSeat.trim().toLowerCase(), a);
      }
    });

    return rowsConfig.map((r, rIdx) => {
      const seats: SeatItem[] = [];
      for (let s = 1; s <= r.seatsCount; s++) {
        const seatId = `R${String.fromCharCode(65 + rIdx)}-${s}`;
        const seatLabel = `Row ${String.fromCharCode(65 + rIdx)} · Seat ${s}`;
        const occupant = occupiedMap.get(seatLabel.toLowerCase());
        const isOccupied = !!occupant || (rIdx === 0 && s % 3 === 0) || (rIdx === 1 && s % 4 === 0);

        seats.push({
          id: seatId,
          label: seatLabel,
          section: r.row,
          status: isOccupied ? 'occupied' : 'available',
          tierId: tier.id,
          occupantName: occupant ? occupant.fullName : isOccupied ? 'Reserved Delegate' : undefined,
          occupantCompany: occupant ? occupant.company : undefined,
        });
      }
      return {
        ...r,
        seats,
      };
    });
  }, [attendees, tier.id]);

  const handleSeatClick = (seat: SeatItem) => {
    if (readOnly || seat.status === 'occupied') return;
    onSelectSeat({
      id: seat.id,
      label: seat.label,
      section: seat.section,
    });
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.7, Math.round((prev + delta) * 10) / 10)));
  };

  const selectedSeatObj = useMemo(() => {
    if (!selectedSeatId) return null;
    if (layoutMode === 'dinner_tables') {
      for (const table of dinnerTables) {
        const found = table.seats.find((s) => s.id === selectedSeatId || s.label === selectedSeatId);
        if (found) return found;
      }
    } else {
      for (const row of theaterRows) {
        const found = row.seats.find((s) => s.id === selectedSeatId || s.label === selectedSeatId);
        if (found) return found;
      }
    }
    return null;
  }, [selectedSeatId, layoutMode, dinnerTables, theaterRows]);

  // Overall Stats
  const allSeats = useMemo(() => {
    if (layoutMode === 'dinner_tables') {
      return dinnerTables.flatMap((t) => t.seats);
    }
    return theaterRows.flatMap((r) => r.seats);
  }, [layoutMode, dinnerTables, theaterRows]);

  const totalSeats = allSeats.length;
  const occupiedSeats = allSeats.filter((s) => s.status === 'occupied').length;
  const availableSeats = totalSeats - occupiedSeats;
  const occupancyPercent = totalSeats > 0 ? Math.round((occupiedSeats / totalSeats) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs space-y-4">
      {/* Top Header & Visual Layout Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              {layoutMode === 'dinner_tables' ? 'Banquet Seating Chart' : 'Auditorium Plenary Seating'}
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 text-white font-mono">
              Live Allocation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Select an available seat for <strong className="text-slate-800">{tier.name}</strong>. Assigned seats are embedded in the QR badge pass.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-200/80 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setLayoutMode('dinner_tables')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                layoutMode === 'dinner_tables' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gala Tables
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('theater_rows')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                layoutMode === 'theater_rows' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Plenary Rows
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 text-xs text-slate-600">
            <button
              type="button"
              onClick={() => handleZoom(0.1)}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => handleZoom(-0.1)}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:bg-slate-100 rounded text-slate-700"
              title="Reset View"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Legend Bar */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-white">
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-white border-2 border-slate-300" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600 ring-2 ring-emerald-200" />
            <span className="font-semibold text-slate-900">Your Selection</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 opacity-60" />
            <span>Occupied</span>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          <span>Occupancy: </span>
          <strong className="text-slate-900">{occupiedSeats} / {totalSeats} ({occupancyPercent}%)</strong>
          <span> · </span>
          <span className="text-emerald-700 font-medium">{availableSeats} seats open</span>
        </div>
      </div>

      {/* Interactive Seating Canvas Area */}
      <div className="relative overflow-auto p-4 sm:p-6 bg-slate-900/5 min-h-[440px] flex flex-col items-center justify-center">
        {/* Stage Indicator */}
        <div className="w-full max-w-xl mx-auto mb-6">
          <div className="h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs font-semibold uppercase tracking-widest shadow-xs">
            <span>Stage · Keynote Lectern & Presidential Podium</span>
          </div>
          <div className="text-center text-[10px] text-slate-400 mt-1">
            Front View Facing Ballroom Audience
          </div>
        </div>

        {/* Scaled Seating Grid */}
        <div
          className="transition-transform duration-200 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {layoutMode === 'dinner_tables' ? (
            /* Banquet Round Tables Layout */
            <div className="relative w-[600px] h-[680px]">
              {dinnerTables.map((table) => (
                <div
                  key={table.id}
                  className="absolute"
                  style={{ left: `${table.x - 70}px`, top: `${table.y - 70}px` }}
                >
                  {/* Central Table Round */}
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-white border-2 border-slate-300 shadow-xs flex flex-col items-center justify-center text-center p-2 z-10">
                      <span className="font-mono text-xs font-bold text-slate-900">{table.id}</span>
                      <span className="text-[9px] text-slate-500 line-clamp-1 leading-tight mt-0.5">
                        {table.name.replace('Table ', 'T')}
                      </span>
                    </div>

                    {/* Radial Seats around table */}
                    {table.seats.map((seat, seatIdx) => {
                      const radius = 52;
                      const angle = ((seatIdx) * (360 / table.seatsCount) - 90) * (Math.PI / 180);
                      const leftPos = 72 + radius * Math.cos(angle) - 13;
                      const topPos = 72 + radius * Math.sin(angle) - 13;

                      const isSelected = selectedSeatId === seat.id || selectedSeatId === seat.label;
                      const isOccupied = seat.status === 'occupied';

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={readOnly || isOccupied}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className={`absolute w-7 h-7 rounded-full text-[10px] font-mono font-semibold flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-2 border-emerald-600 ring-4 ring-emerald-200 z-20 scale-110 shadow-sm'
                              : isOccupied
                              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                              : 'bg-white text-slate-700 border-2 border-slate-300 hover:border-slate-900 hover:scale-105 shadow-2xs z-10'
                          }`}
                          style={{ left: `${leftPos}px`, top: `${topPos}px` }}
                          title={`${seat.label} (${seat.section}) - ${isOccupied ? 'Occupied' : 'Available'}`}
                          aria-label={`${seat.label} - ${isOccupied ? 'Occupied' : 'Available'}`}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : seatIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Auditorium Curved Rows Layout */
            <div className="w-full max-w-2xl space-y-4 py-2">
              {theaterRows.map((r, rIdx) => (
                <div key={rIdx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-500 px-2 font-mono">
                    <span className="font-semibold text-slate-800">{r.row}</span>
                    <span className="text-[10px] text-slate-400">{r.tierName}</span>
                  </div>

                  <div className="flex items-center justify-center gap-1.5 flex-wrap bg-white/60 p-2 rounded-lg border border-slate-200">
                    {r.seats.map((seat, sIdx) => {
                      const isSelected = selectedSeatId === seat.id || selectedSeatId === seat.label;
                      const isOccupied = seat.status === 'occupied';

                      return (
                        <button
                          key={seat.id}
                          type="button"
                          disabled={readOnly || isOccupied}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-md text-[10px] sm:text-xs font-mono font-medium flex items-center justify-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-500 text-white border-2 border-emerald-600 ring-3 ring-emerald-200 z-20 scale-105'
                              : isOccupied
                              ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed opacity-60'
                              : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-900 hover:scale-105 shadow-2xs'
                          }`}
                          title={`${seat.label} - ${isOccupied ? 'Occupied' : 'Available'}`}
                          aria-label={`${seat.label} - ${isOccupied ? 'Occupied' : 'Available'}`}
                        >
                          {isSelected ? <Check className="w-3 h-3 text-white" /> : sIdx + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Selected Seat or Hovered Seat Details Box */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div>
          {selectedSeatObj ? (
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="text-slate-500">Reserved Location: </span>
                <strong className="text-slate-900 font-bold text-sm">{selectedSeatObj.label}</strong>
                <span className="text-slate-400"> ({selectedSeatObj.section})</span>
              </div>
            </div>
          ) : hoveredSeat ? (
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400" />
              <div>
                <span className="font-semibold text-slate-900">{hoveredSeat.label}</span>
                <span className="text-slate-500"> · {hoveredSeat.section}</span>
                {hoveredSeat.occupantName && (
                  <span className="text-slate-400"> (Occupied by {hoveredSeat.occupantName})</span>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-500">
              <Info className="w-4 h-4 text-slate-400" />
              <span>Click on any empty white circle to claim your dedicated seat.</span>
            </div>
          )}
        </div>

        {selectedSeatObj && !readOnly && (
          <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md text-xs font-semibold">
            <Check className="w-3.5 h-3.5" />
            <span>Seat Locked for Checkout</span>
          </div>
        )}
      </div>
    </div>
  );
};
