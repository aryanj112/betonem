/**
 * Groups List Component - Client Component for Home Page
 */

"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Group {
  id: string;
  name: string;
  image_url?: string | null;
  balance: number;
}

interface GroupsListProps {
  groups: Group[];
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
};

export function GroupsList({ groups }: GroupsListProps) {
  if (groups.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}>
        <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Join or create a group to start betting!</p>
      </div>
    );
  }

  return (
    <motion.div
      style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {groups.map((group) => (
        <motion.div key={group.id} variants={itemVariants}>
          <Link
            href={`/groups/${group.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '1.25rem',
              background: 'rgba(10, 10, 30, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              textDecoration: 'none',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 108, 159, 0.5)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 108, 159, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(255, 108, 159, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ff6c9f',
                fontSize: '1.5rem',
                fontWeight: '600',
              }}>
                {group.name.charAt(0).toUpperCase()}
              </div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                {group.name}
              </h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#ff6c9f', margin: 0 }}>
                {group.balance}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                coins
              </p>
            </div>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}

