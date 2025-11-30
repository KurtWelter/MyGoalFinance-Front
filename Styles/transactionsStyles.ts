// Styles/transactionsStyles.ts
import { StyleSheet } from 'react-native';

const BG = '#020617';
const PANEL = '#020617';
const PANEL_SOFT = '#020617';
const FG = '#e5e7eb';
const MUTED = '#9ca3af';
const BORDER = '#1f2937';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },

  /* HEADER */
  header: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  h1: {
    color: FG,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  /* KPIs */
  kpisRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: PANEL,
    borderWidth: 1,
  },
  kpiLabel: {
    color: MUTED,
    fontSize: 11,
    marginBottom: 2,
  },
  kpiValue: {
    color: FG,
    fontSize: 14,
    fontWeight: '800',
  },

  /* Botón Importar */
  actionsRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  btnSecondary: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb40',
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnSecondaryTxt: {
    color: FG,
    fontSize: 13,
    fontWeight: '600',
  },

  /* LISTA */
  listWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  loader: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  txLeft: {
    flexShrink: 1,
    paddingRight: 12,
  },
  txTitle: {
    color: FG,
    fontSize: 14,
    fontWeight: '600',
  },
  txMeta: {
    color: MUTED,
    fontSize: 11,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '800',
  },
  separator: {
    height: 1,
    backgroundColor: BORDER,
    opacity: 0.6,
  },
  emptyContent: {
    paddingVertical: 32,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: PANEL_SOFT,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    color: MUTED,
    textAlign: 'center',
  },

  /* FAB */
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 999,
    backgroundColor: '#facc15',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },

  /* MODAL */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.82)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#020617',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#1f2937',
    maxHeight: '85%',
  },
  modalHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#4b5563',
    marginBottom: 8,
  },
  modalTitle: {
    color: FG,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalContent: {
    paddingBottom: 12,
    gap: 10,
  },

  /* Tabs ingreso/gasto */
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tabChip: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
  },
  tabChipActive: {
    backgroundColor: '#facc15',
    borderColor: '#facc15',
  },
  tabTxt: {
    color: FG,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTxtActive: {
    color: '#111827',
  },

  /* Inputs */
  fieldLabel: {
    color: MUTED,
    fontSize: 12,
    marginBottom: 4,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: FG,
    backgroundColor: '#020617',
    fontSize: 14,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },

  /* Botones modal */
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#4b5563',
  },
  btnGhostTxt: {
    color: MUTED,
    fontWeight: '600',
  },
  btnPrimary: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: '#facc15',
  },
  btnPrimaryTxt: {
    color: '#111827',
    fontWeight: '800',
  },
});

export default styles;
