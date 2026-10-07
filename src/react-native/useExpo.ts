import { useEffect, useState } from 'react';
import { logWarning } from '../_/utils';
import type { ExpoVideoModule } from './types';

type Expo = {
    Image?: unknown;
    Video?: ExpoVideoModule;
}
type Module = `Image` | `Video`;
type OptionalModule = ExpoVideoModule & {
    Image?: unknown;
};

const messageConfig: Record< Module, string > = {
    "Image":
        // eslint-disable-next-line max-len
        `Image Caching requires 'expo' and 'expo-image' dependencies. For more information, refer to the documentation: https://www.twicpics.com/docs/components/react-native`,
    "Video":
        // eslint-disable-next-line max-len
        `TwicVideo requires 'expo' and 'expo-video' dependencies. For more information, refer to the documentation: https://www.twicpics.com/docs/components/react-native`,
};

/**
 * stores already loaded libraries
 */
const _expo: Expo = {};

let optionalModules: OptionalModule[];

/**
 * requires optional `expo-image`, `expo-video` and the deprecated `expo-av`
 * depending on the bundler, requiring a missing optional dependency either throws,
 * returns an empty module or returns the next installed one,
 * so modules are identified by their exports rather than by their name
 */
const getOptionalModules = (): OptionalModule[] => {
    if ( !optionalModules ) {
        optionalModules = [];
        try {
            // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
            optionalModules.push( require( `expo-image` ) );
        } catch {
            // `expo-image` is not installed
        }
        try {
            // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
            optionalModules.push( require( `expo-video` ) );
        } catch {
            // `expo-video` is not installed
        }
        try {
            // eslint-disable-next-line no-undef, @typescript-eslint/no-var-requires
            optionalModules.push( require( `expo-av` ) );
        } catch {
            // `expo-av` is not installed
        }
    }
    return optionalModules;
};

const findOptionalModule = ( predicate: ( optionalModule: OptionalModule ) => unknown ) =>
    getOptionalModules().find( optionalModule => optionalModule && predicate( optionalModule ) );

const loaders: { [ M in Module ]: () => Expo[ M ] } = {
    // eslint-disable-next-line no-shadow
    "Image": () => findOptionalModule( ( { Image } ) => Image )?.Image || null,
    "Video": () => {
        const expoVideo = findOptionalModule( ( { useVideoPlayer, VideoView } ) => useVideoPlayer && VideoView );
        if ( expoVideo ) {
            return {
                "useVideoPlayer": expoVideo.useVideoPlayer,
                "VideoView": expoVideo.VideoView,
            };
        }
        const expoAv = findOptionalModule( ( { Video } ) => Video );
        return expoAv ? {
            "Video": expoAv.Video,
        } : null;
    },
};

export default ( module: Module ) => {
    const [ expo, setExpo ] = useState< Expo >( _expo );
    useEffect( () => {
        if ( _expo[ module ] === undefined ) {
            Object.assign( _expo, {
                [ module ]: loaders[ module ](),
            } );
            if ( !_expo[ module ] ) {
                logWarning( messageConfig[ module ] );
            }
            setExpo( _expo );
        }
    }, [] );
    return expo;
};
