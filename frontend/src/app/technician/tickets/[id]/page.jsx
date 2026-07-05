'use client';

import { useParams } from 'next/navigation';
import TicketDetailView from '@/views/TicketDetailView';

export default function TechnicianTicketDetailPage() {
  const { id } = useParams();
  return <TicketDetailView basePath="/technician" id={id} />;
}
