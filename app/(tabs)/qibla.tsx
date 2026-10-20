import { useCallback, useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Platform,
  TextInput,
} from 'react-native';
import { Magnetometer } from 'expo-sensors';
import * as Location from 'expo-location';
import { MapPin, Navigation, RotateCw } from 'lucide-react-native';
import { Header } from '@/components/Header';
import { useSettings } from '@/lib/settingsContext';
import {
  angularDifference,
  calculateDistanceToKaaba,
  calculateQiblaBearing,
  KAABA_LAT,
  KAABA_LNG,
  normalizeAngle,
} from '@/lib/qibla';

export default function QiblaTab() {
  const { theme } = useSettings();
  const [heading, setHeading] = useState<number | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'error' | 'ready'>('idle');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');
  const [magAvailable, setMagAvailable] = useState(true);

  // Determine a working location: GPS if available, otherwise manual input.
  const requestLocation = useCallback(async () => {
    setLocationStatus('loading');
    setLocationError(null);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('error');
        setLocationError('Location permission denied. Enter coordinates manually below.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationStatus('ready');
    } catch (e) {
      setLocationStatus('error');
      setLocationError(e instanceof Error ? e.message : 'Unable to fetch location');
    }
  }, []);

  // Magnetometer subscription for compass heading.
  useEffect(() => {
    if (Platform.OS === 'web') {
      // Magnetometer is not available on web; user can drag the dial instead.
      setMagAvailable(false);
      return;
    }
    const sub = Magnetometer.addListener((data) => {
      // Magnetometer vector (x, y) → heading angle from North.
      // x is horizontal (east), y is vertical (north, often negative on device).
      let angle = Math.atan2(data.y, data.x) * (180 / Math.PI);
      // Normalize to [0, 360), offset for device orientation.
      angle = normalizeAngle(angle + 90);
      setHeading(angle);
    });
    Magnetometer.setUpdateInterval(100);
    return () => {
      sub.remove();
    };
  }, []);

  const qiblaBearing = location ? calculateQiblaBearing(location.lat, location.lng) : null;
  const distance = location ? calculateDistanceToKaaba(location.lat, location.lng) : null;
  const alignmentDiff =
    heading !== null && qiblaBearing !== null ? angularDifference(heading, qiblaBearing) : null;
  const aligned = alignmentDiff !== null && alignmentDiff <= 3;

  const applyManual = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setLocation({ lat, lng });
      setLocationStatus('ready');
      setLocationError(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Header title="Qibla Finder" subtitle="Direction to the Kaaba in Mecca" />

      <View style={styles.content}>
        {/* Compass dial */}
        <Compass
          heading={heading}
          qiblaBearing={qiblaBearing}
          aligned={aligned}
          theme={theme}
          interactive={!magAvailable}
          onHeadingChange={setHeading}
        />

        {/* Bearing readout */}
        <View style={[styles.readout, { backgroundColor: theme.bgElevated }]}>
          <View style={styles.readoutRow}>
            <Navigation size={16} color={theme.primary} strokeWidth={2} />
            <Text style={[styles.readoutLabel, { color: theme.textSecondary }]}>Qibla bearing</Text>
            <Text style={[styles.readoutValue, { color: theme.text }]}>
              {qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : '—'}
            </Text>
          </View>
          <View style={[styles.readoutDivider, { backgroundColor: theme.divider }]} />
          <View style={styles.readoutRow}>
            <RotateCw size={16} color={theme.textSecondary} strokeWidth={2} />
            <Text style={[styles.readoutLabel, { color: theme.textSecondary }]}>Your heading</Text>
            <Text style={[styles.readoutValue, { color: theme.text }]}>
              {heading !== null ? `${heading.toFixed(0)}°` : '—'}
            </Text>
          </View>
          {distance !== null && (
            <>
              <View style={[styles.readoutDivider, { backgroundColor: theme.divider }]} />
              <View style={styles.readoutRow}>
                <MapPin size={16} color={theme.textSecondary} strokeWidth={2} />
                <Text style={[styles.readoutLabel, { color: theme.textSecondary }]}>
                  Distance to Kaaba
                </Text>
                <Text style={[styles.readoutValue, { color: theme.text }]}>
                  {distance.toFixed(0).toLocaleString()} km
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Alignment indicator */}
        {aligned && qiblaBearing !== null && (
          <View style={[styles.alignedBanner, { backgroundColor: theme.success }]}>
            <Text style={[styles.alignedText, { color: theme.textOnPrimary }]}>
              Aligned with Qibla
            </Text>
          </View>
        )}

        {/* Location controls */}
        <View style={styles.locationBox}>
          {locationStatus === 'loading' ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Pressable
              onPress={requestLocation}
              style={({ pressed }) => [
                styles.locationBtn,
                { backgroundColor: theme.primary, borderColor: theme.primary },
                pressed && { opacity: 0.85 },
              ]}
            >
              <MapPin size={16} color={theme.textOnPrimary} strokeWidth={2} />
              <Text style={[styles.locationBtnText, { color: theme.textOnPrimary }]}>
                {location ? 'Update my location' : 'Use my location'}
              </Text>
            </Pressable>
          )}

          {location ? (
            <Text style={[styles.coordsText, { color: theme.textSecondary }]}>
              {location.lat.toFixed(4)}°, {location.lng.toFixed(4)}°
            </Text>
          ) : null}

          {locationError ? (
            <Text style={[styles.errorText, { color: theme.error }]}>{locationError}</Text>
          ) : null}

          {!magAvailable && (
            <Text style={[styles.webHint, { color: theme.textSecondary }]}>
              Compass sensor is not available in the browser. Drag the dial to simulate heading.
            </Text>
          )}

          {/* Manual coordinates fallback */}
          <View style={styles.manualRow}>
            <TextInput
              value={manualLat}
              onChangeText={setManualLat}
              placeholder="Latitude"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              style={[styles.manualInput, { backgroundColor: theme.bgElevated, color: theme.text, borderColor: theme.border }]}
            />
            <TextInput
              value={manualLng}
              onChangeText={setManualLng}
              placeholder="Longitude"
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              style={[styles.manualInput, { backgroundColor: theme.bgElevated, color: theme.text, borderColor: theme.border }]}
            />
            <Pressable
              onPress={applyManual}
              style={({ pressed }) => [
                styles.manualBtn,
                { backgroundColor: theme.bgCard, borderColor: theme.border },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.manualBtnText, { color: theme.text }]}>Set</Text>
            </Pressable>
          </View>
        </View>

        <Text style={[styles.kaabaNote, { color: theme.textSecondary }]}>
          Kaaba coordinate: {KAABA_LAT}° N, {KAABA_LNG}° E
        </Text>
      </View>
    </View>
  );
}

interface CompassProps {
  heading: number | null;
  qiblaBearing: number | null;
  aligned: boolean;
  interactive: boolean;
  onHeadingChange: (h: number) => void;
  theme: ReturnType<typeof useSettings>['theme'];
}

function Compass({ heading, qiblaBearing, aligned, interactive, onHeadingChange, theme }: CompassProps) {
  const dialRotation = heading !== null ? -heading : 0;
  const qiblaMarkerAngle = qiblaBearing !== null ? qiblaBearing - (heading ?? 0) : 0;

  const size = 280;
  const center = size / 2;
  const radius = size / 2 - 18;

  const onDrag = (e: { locationX: number; locationY: number }) => {
    const dx = e.locationX - center;
    const dy = e.locationY - center;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    onHeadingChange(normalizeAngle(angle));
  };

  return (
    <View style={[styles.compassOuter, { borderColor: aligned ? theme.success : theme.border }]}>
      <Pressable
        style={[styles.compassDial, { width: size, height: size }]}
        onPress={interactive ? (e) => onDrag({ locationX: e.nativeEvent.locationX, locationY: e.nativeEvent.locationY }) : undefined}
        disabled={!interactive}
      >
        {/* Rotating dial */}
        <View
          style={{
            width: size,
            height: size,
            transform: [{ rotate: `${dialRotation}deg` }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Cardinal points */}
          <Text style={[styles.cardinal, styles.north, { color: theme.error, top: 4 }]}>N</Text>
          <Text style={[styles.cardinal, styles.east, { color: theme.textSecondary }]}>E</Text>
          <Text style={[styles.cardinal, styles.south, { color: theme.textSecondary }]}>S</Text>
          <Text style={[styles.cardinal, styles.west, { color: theme.textSecondary }]}>W</Text>

          {/* Tick marks ring */}
          <View style={[styles.ring, { width: radius * 2, height: radius * 2, borderColor: theme.border }]} />

          {/* Qibla marker — rotates relative to dial */}
          {qiblaBearing !== null && (
            <View
              style={{
                position: 'absolute',
                width: size,
                height: size,
                transform: [{ rotate: `${qiblaMarkerAngle}deg` }],
                alignItems: 'center',
              }}
            >
              <View
                style={{
                  marginTop: 6,
                  width: 0,
                  height: 0,
                  borderLeftWidth: 11,
                  borderRightWidth: 11,
                  borderBottomWidth: 22,
                  borderLeftColor: 'transparent',
                  borderRightColor: 'transparent',
                  borderBottomColor: theme.primary,
                }}
              />
              <View
                style={{
                  marginTop: -2,
                  width: 4,
                  height: radius - 16,
                  backgroundColor: theme.primary,
                  borderRadius: 2,
                }}
              />
            </View>
          )}
        </View>

        {/* Fixed center Kaaba icon */}
        <View style={[styles.centerKnob, { backgroundColor: theme.bgElevated, borderColor: theme.primary }]}>
          <Text style={[styles.kabahText, { color: theme.primary }]}>kaaba</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 12 },
  compassOuter: {
    width: 300,
    height: 300,
    borderRadius: 150,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  compassDial: { alignItems: 'center', justifyContent: 'center' },
  cardinal: {
    position: 'absolute',
    fontFamily: 'Inter-Bold',
    fontSize: 14,
  },
  north: {},
  east: { right: 4 },
  south: { bottom: 4 },
  west: { left: 4 },
  ring: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centerKnob: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kabahText: {
    fontFamily: 'Inter-Bold',
    fontSize: 11,
    textTransform: 'lowercase',
  },
  readout: {
    width: '100%',
    borderRadius: 14,
    padding: 16,
  },
  readoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  readoutLabel: { flex: 1, fontFamily: 'Inter-Regular', fontSize: 13 },
  readoutValue: { fontFamily: 'Inter-SemiBold', fontSize: 15 },
  readoutDivider: { height: 1, marginVertical: 4 },
  alignedBanner: {
    marginTop: 14,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 12,
  },
  alignedText: { fontFamily: 'Inter-Bold', fontSize: 14 },
  locationBox: {
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
  },
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
  },
  locationBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
  coordsText: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 8 },
  errorText: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 8, textAlign: 'center' },
  webHint: { fontFamily: 'Inter-Regular', fontSize: 12, marginTop: 8, textAlign: 'center' },
  manualRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    width: '100%',
  },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'Inter-Regular',
    fontSize: 14,
  },
  manualBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
  },
  manualBtnText: { fontFamily: 'Inter-SemiBold', fontSize: 14 },
  kaabaNote: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: 16,
    textAlign: 'center',
  },
});
