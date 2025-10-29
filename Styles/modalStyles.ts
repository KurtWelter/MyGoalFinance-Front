import { StyleSheet } from 'react-native';

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  sheet: {
    alignSelf: 'stretch',     // evita el error de width:'100%'
    borderRadius: 18,
    padding: 18,
    backgroundColor: '#20293a',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  label: { color: '#c8d0e0', marginTop: 14, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#121826',
    color: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a3550',
  },
  row: { flexDirection: 'row', gap: 12, marginTop: 16 },
  btnLeft: { flex: 1 },
  btnRight: { flex: 1 },
});

export default modalStyles;
