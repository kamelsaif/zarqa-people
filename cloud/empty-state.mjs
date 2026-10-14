export function emptyState() {
  return {
    schema: 1, revision: 0,
    settings: { company: 'زرقاء', product: 'ZARQA People', accent: '#C8A252', logo: '',
      currency: 'EGP', payday: 28, autoSend: false, weekend: [5,6], policyVersion: '1.0',
      requiredDocuments: [], managerEmail: '', hrEmail: '', financeEmail: '' },
    access: [], employees: [], attendance: [], jobs: [], candidates: [], leaves: [],
    policies: [], payroll: [], offboarding: [], reviews: [], events: [], audit: [],
    documents: [], requests: [], shifts: [], contracts: []
  };
}
