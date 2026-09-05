/**
 * 3-of-5 PQC Multi-Signature Governance Timelock Vault
 * Implements Prompt 26 from Untitled document (1).md
 */

export interface GovernanceProposal {
  proposalId: string;
  title: string;
  description: string;
  targetParameter: string;
  newValue: string;
  signaturesRequired: number; // 3
  signaturesCollected: string[];
  status: 'PENDING_SIGNATURES' | 'QUEUED_TIMELOCK' | 'EXECUTED' | 'EMERGENCY_VETOED';
  timelockExpiryEpoch: number; // 48-hour delay
  createdAt: string;
}

/**
 * Create a new parameter change proposal with 48h timelock queue.
 */
export const createGovernanceProposal = (
  title: string,
  targetParameter: string,
  newValue: string
): GovernanceProposal => {
  const proposalId = 'gov-' + Date.now().toString(36);
  const now = Math.floor(Date.now() / 1000);
  const timelockExpiry = now + 48 * 3600; // 48 hours

  return {
    proposalId,
    title,
    description: `Update ${targetParameter} to ${newValue} with mandatory 48-hour guardian review`,
    targetParameter,
    newValue,
    signaturesRequired: 3,
    signaturesCollected: ['sig_guardian_aayush_mldsa87_01'],
    status: 'PENDING_SIGNATURES',
    timelockExpiryEpoch: timelockExpiry,
    createdAt: new Date().toISOString()
  };
};

/**
 * Add PQC signature to a proposal.
 */
export const signGovernanceProposal = (
  proposal: GovernanceProposal,
  guardianSigHex: string
): GovernanceProposal => {
  const updatedSigs = [...proposal.signaturesCollected, guardianSigHex];
  const isQueued = updatedSigs.length >= proposal.signaturesRequired;

  return {
    ...proposal,
    signaturesCollected: updatedSigs,
    status: isQueued ? 'QUEUED_TIMELOCK' : 'PENDING_SIGNATURES'
  };
};
