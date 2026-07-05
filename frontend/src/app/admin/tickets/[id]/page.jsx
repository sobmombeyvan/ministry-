'use client';

import { useParams } from 'next/navigation';
import TicketDetailView from '@/views/TicketDetailView';

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  return <TicketDetailView basePath="/admin" id={id} />;
}
