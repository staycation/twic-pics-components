import React, { useEffect, useState } from "react";
// eslint-disable-next-line no-shadow
import { Image } from "react-native";
import { styles } from "./styles";
import type { AssetAttributes, ExpoVideoModule } from "./types";
import useExpo from "./useExpo";
import { isSameAsset } from "./utils";

type VideoAttributes = AssetAttributes & ExpoVideoModule;

const Poster = ( { onLoad, poster }: AssetAttributes ) => (
    <Image
        onLoad= { onLoad }
        source={ {
            "uri": poster,
        } }
        style={ [ styles.asset ] }
    />
);

/**
 * renders the video with `expo-video`
 */
const ExpoVideo = ( { onLoad, poster, uri, useVideoPlayer, VideoView }: VideoAttributes ) => {
    const [ ready, setReady ] = useState( false );
    const player = useVideoPlayer( {
        uri,
    }, _player => {
        // eslint-disable-next-line no-param-reassign
        _player.loop = true;
        // eslint-disable-next-line no-param-reassign
        _player.muted = true;
        _player.play();
    } );
    useEffect( () => {
        setReady( false );
        const onStatusChange = () => {
            if ( player.status === `readyToPlay` ) {
                setReady( true );
                onLoad();
            }
        };
        const subscription = player.addListener( `statusChange`, onStatusChange );
        onStatusChange();
        return () => subscription.remove();
    }, [ player ] );
    return (
        <>
            <VideoView
                contentFit={ `cover` }
                nativeControls={ false }
                player={ player }
                style={ [ styles.asset ] }
                surfaceType={ `textureView` }
            />
            { !ready && <Poster onLoad={ onLoad } poster={ poster } uri={ uri } /> }
        </>
    );
};

/**
 * renders the video with the deprecated `expo-av`
 */
const ExpoAvVideo = ( { onLoad, poster, uri, Video }: VideoAttributes ) => (
    <Video
        isLooping
        isMuted
        onReadyForDisplay={ onLoad }
        PosterComponent={() => <Poster onLoad={ onLoad } poster={ poster } uri={ uri } />}
        resizeMode={ `cover` }
        shouldPlay
        source={ {
            uri,
        } }
        style={ [ styles.asset ] }
        usePoster
        videoStyle= { {
            "width": `100%`,
            "height": `100%`,
        }}
    ></Video>
);

// eslint-disable-next-line react/display-name
export default React.memo( ( props: AssetAttributes ) => {
    const { "Video": videoModule } = useExpo( `Video` );
    const VideoComponent = videoModule?.VideoView ? ExpoVideo : ExpoAvVideo;
    return (
        props.uri && videoModule && <VideoComponent { ...props } { ...videoModule } />
    );
}, isSameAsset );
