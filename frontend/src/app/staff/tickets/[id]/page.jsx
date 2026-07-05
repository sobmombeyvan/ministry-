'use client';

import { useParams } from 'next/navigation';
import TicketDetailView from '@/views/TicketDetailView';

export default function StaffTicketDetailPage() {
  const { id } = useParams();
  return <TicketDetailView basePath="/staff" id={id} />;
}
