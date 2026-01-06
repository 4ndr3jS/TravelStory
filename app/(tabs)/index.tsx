import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Import StatusBar only from expo-status-bar
import { StatusBar } from 'expo-status-bar'; 
import RoutePlanner from '../../components/RoutePlanner';
import StoryPlayer from '../../components/StoryPlayer';
import { AppState, RouteDetails, AudioStory } from '../../types';
import { generateSegment, calculateTotalSegments, generateStoryOutline } from '../../services/aiService';
import { AppState as RNAppState, AppStateStatus } from 'react-native';

// --- Timeout helper ---
const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> => {
  let timer: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error(errorMsg)), ms);
  });
  return Promise.race([
    promise.then(val => { clearTimeout(timer); return val; }),
    timeoutPromise
  ]);
};

export default function App() {
  console.log('App mounted');
  const [appState, setAppState] = useState<AppState>(AppState.PLANNING);
  const [route, setRoute] = useState<RouteDetails | null>(null);
  const [story, setStory] = useState<AudioStory | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generationError, setGenerationError] = useState<string | null>(null);

  const isGeneratingRef = useRef<boolean>(false);
  const [isBackgroundGenerating, setIsBackgroundGenerating] = useState(false);
  const [currentPlayingIndex, setCurrentPlayingIndex] = useState<number>(0);

// Handle app state changes (background/foreground)
useEffect(() => {
  const subscription = RNAppState.addEventListener(
    'change',
    (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && route && story) {
        // App came back to foreground, check if we need to buffer more segments
        const segmentsNeeded = story.totalSegmentsEstimate - story.segments.length;
        if (segmentsNeeded > 0 && !isGeneratingRef.current) {
          bufferNextSegments();
        }
      }
    }
  );

  return () => subscription.remove();
}, [route, story]);


  const handleRouteFound = async (routeDetails: RouteDetails) => {
    setRoute(routeDetails);
    setAppState(AppState.GENERATING_INITIAL_SEGMENT);
    setLoadingMessage('Creating your story outline...');
    setGenerationError(null);

    try {
      const totalSegments = calculateTotalSegments(routeDetails.durationSeconds);
      const outline = await withTimeout(
        generateStoryOutline(routeDetails, totalSegments),
        60000,
        'Story outline generation timed out'
      );

      const audioStory: AudioStory = {
        totalSegmentsEstimate: totalSegments,
        outline,
        segments: []
      };

      setStory(audioStory);
      setAppState(AppState.READY_TO_PLAY);
      setLoadingMessage('');

      bufferNextSegments();
    } catch (error: any) {
      console.error('Story generation failed:', error);
      setGenerationError(error.message || 'Failed to generate story');
      setAppState(AppState.PLANNING);
      setLoadingMessage('');
    }
  };

  const bufferNextSegments = async () => {
    if (!route || !story || isGeneratingRef.current) return;

    isGeneratingRef.current = true;
    setIsBackgroundGenerating(true);

    try {
      const segmentsNeeded = story.totalSegmentsEstimate - story.segments.length;
      const segmentsToGenerate = Math.min(3, segmentsNeeded);

      for (let i = 0; i < segmentsToGenerate; i++) {
        const segmentIndex = story.segments.length + 1;
        const segmentOutline = story.outline[segmentIndex - 1];
        const previousContext = story.segments.map(s => s.text).join(' ');

        setLoadingMessage(`Generating segment ${segmentIndex} of ${story.totalSegmentsEstimate}...`);

        const segment = await withTimeout(
          generateSegment(route, segmentIndex, story.totalSegmentsEstimate, segmentOutline, previousContext),
          45000,
          `Segment ${segmentIndex} generation timed out`
        );

        setStory(prevStory => ({
          ...prevStory!,
          segments: [...prevStory!.segments, segment]
        }));
      }
    } catch (error: any) {
      console.error('Background generation error:', error);
      setGenerationError(error.message || 'Story generation interrupted');
    } finally {
      isGeneratingRef.current = false;
      setIsBackgroundGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleSegmentPlay = (segmentIndex: number) => {
    setCurrentPlayingIndex(segmentIndex);
    if (story && segmentIndex >= story.segments.length - 2 && !isGeneratingRef.current) {
      bufferNextSegments();
    }
  };

  const resetApp = () => {
    setAppState(AppState.PLANNING);
    setRoute(null);
    setStory(null);
    setLoadingMessage('');
    setGenerationError(null);
    setCurrentPlayingIndex(0);
    isGeneratingRef.current = false;
    setIsBackgroundGenerating(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A1A1A', '#2D2D2D']} style={styles.gradient}>
        {Platform.OS !== 'web' && <StatusBar style="light" />}

        {appState === AppState.PLANNING && (
          <RoutePlanner
            onRouteFound={handleRouteFound}
            loading={false}
            error={generationError}
          />
        )}

        {(appState === AppState.READY_TO_PLAY || appState === AppState.PLAYING) && route && story && (
          <StoryPlayer
            route={route}
            story={story}
            onSegmentPlay={handleSegmentPlay}
            onReset={resetApp}
            isBackgroundGenerating={isBackgroundGenerating}
            loadingMessage={loadingMessage}
          />
        )}

        {appState === AppState.GENERATING_INITIAL_SEGMENT && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{loadingMessage}</Text>
          </View>
        )}

        {generationError && appState === AppState.PLANNING && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{generationError}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  loadingText: { color: '#FFF', fontSize: 18, textAlign: 'center', marginBottom: 20 },
  errorContainer: { position: 'absolute', bottom: 100, left: 20, right: 20, backgroundColor: 'rgba(239,68,68,0.9)', padding: 15, borderRadius: 10 },
  errorText: { color: '#FFF', fontSize: 14, textAlign: 'center' },
});

console.log("App.tsx loaded");