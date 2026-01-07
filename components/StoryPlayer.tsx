import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { AudioStory, RouteDetails } from '../types';

interface Props {
  route: RouteDetails;
  story: AudioStory;
  onSegmentPlay: (index:number)=>void;
  onReset: ()=>void;
  isBackgroundGenerating: boolean;
  loadingMessage: string;
}

const StoryPlayer: React.FC<Props> = ({ route, story, onSegmentPlay, onReset, isBackgroundGenerating, loadingMessage }) => {
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);

  const handleNextSegment = () => {
    if(currentSegmentIndex < story.segments.length-1) setCurrentSegmentIndex(currentSegmentIndex+1);
  };

  const currentSegment = story.segments[currentSegmentIndex];
  const progress = ((currentSegmentIndex+1)/story.totalSegmentsEstimate)*100;

  return (
    <ScrollView style={{flex:1}} contentContainerStyle={{padding:20}}>
      <TouchableOpacity onPress={onReset}><MaterialCommunityIcons name="rotate-left" size={24} color="#FFF"/></TouchableOpacity>
      <Text style={{color:'#FFF', fontSize:20, marginVertical:10}}>Your Journey</Text>

      {currentSegment && <Text style={{color:'#FFF', marginVertical:10}}>{currentSegment.text}</Text>}

      <TouchableOpacity onPress={handleNextSegment} disabled={currentSegmentIndex >= story.segments.length-1}>
        <MaterialCommunityIcons name="skip-next" size={32} color={currentSegmentIndex >= story.segments.length-1 ? 'gray':'#FFF'} />
      </TouchableOpacity>

      {isBackgroundGenerating && <Text style={{color:'#CCC', marginTop:10}}>{loadingMessage}</Text>}
      <View style={{height:4, width:'100%', backgroundColor:'rgba(255,255,255,0.1)', marginTop:10}}>
        <View style={{width:`${progress}%`, height:'100%', backgroundColor:'#1A1A1A'}} />
      </View>
    </ScrollView>
  );
};

export default StoryPlayer;
