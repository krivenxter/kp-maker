import managers from '../data/managers.json';
import type { ProposalDocument } from '../schemas/proposal';

export type ManagerContact = {
  name: string;
  position: string;
  phone: string;
  email: string;
  photoDataUrl?: string;
};

export function resolveManager(proposal: ProposalDocument): ManagerContact | undefined {
  if ((proposal.managerId === 'custom' || proposal.managerId.startsWith('saved:')) && proposal.customManager) {
    return {
      name: `${proposal.customManager.firstName} ${proposal.customManager.lastName}`.trim(),
      position: proposal.customManager.position,
      phone: proposal.customManager.phone,
      email: proposal.customManager.email,
      photoDataUrl: proposal.customManager.photoDataUrl,
    };
  }
  return managers.find((manager) => manager.id === proposal.managerId) ?? managers[0];
}
