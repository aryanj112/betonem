/**
 * Settlements List Component
 * Grid display of settlement cards
 */

"use client";

import { SettlementCard, Settlement } from "./SettlementCard";
import { EarningsEmptyState } from "./EarningsEmptyState";
import styles from "@/styles/SettlementsList.module.css";

interface SettlementsListProps {
  settlements: Settlement[];
  isEmpty?: boolean;
}

export function SettlementsList({ settlements, isEmpty }: SettlementsListProps) {
  if (isEmpty || settlements.length === 0) {
    return <EarningsEmptyState />;
  }

  return (
    <div className={styles.settlementsGrid}>
      {settlements.map((settlement, index) => (
        <SettlementCard
          key={settlement.id}
          settlement={settlement}
          index={index}
        />
      ))}
    </div>
  );
}

