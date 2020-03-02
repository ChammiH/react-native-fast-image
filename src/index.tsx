import React, { forwardRef, memo } from 'react'
import {
    View,
    Image,
    NativeModules,
    requireNativeComponent,
    StyleSheet,
    FlexStyle,
    LayoutChangeEvent,
    ShadowStyleIOS,
    StyleProp,
    TransformsStyle,
} from 'react-native'

const FastImageViewNativeModule = NativeModules.FastImageView

export enum ResizeMode {
    contain = 'contain',
    cover = 'cover',
    stretch = 'stretch',
    center = 'center',
}

export enum Priority {
    // Lower than usual.
    low = 'low',
    // Normal, the default.
    normal = 'normal',
    // Higher than usual.
    high = 'high',
}

export enum Cache {
    // Ignore headers, use uri as cache key, fetch only if not in cache.
    immutable = 'immutable',
    // Respect http headers, no aggressive caching.
    web = 'web',
    // Only load from cache.
    cacheOnly = 'cacheOnly',
}

export type Source = {
    uri?: string
    headers?: { [key: string]: string }
    priority?: Priority
    cache?: Cache
}

export interface OnLoadEvent {
    nativeEvent: {
        width: number
        height: number
    }
}

export interface OnProgressEvent {
    nativeEvent: {
        loaded: number
        total: number
    }
}

export interface ImageStyle extends FlexStyle, TransformsStyle, ShadowStyleIOS {
    backfaceVisibility?: 'visible' | 'hidden'
    borderBottomLeftRadius?: number
    borderBottomRightRadius?: number
    backgroundColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    borderTopLeftRadius?: number
    borderTopRightRadius?: number
    overlayColor?: string
    tintColor?: string
    opacity?: number
}

export interface FastImageProps {
    source: Source | number
    resizeMode?: ResizeMode
    fallback?: boolean

    onLoadStart?(): void

    onProgress?(event: OnProgressEvent): void

    onLoad?(event: OnLoadEvent): void

    onError?(): void

    onLoadEnd?(): void

    /**
     * onLayout function
     *
     * Invoked on mount and layout changes with
     *
     * {nativeEvent: { layout: {x, y, width, height}}}.
     */
    onLayout?: (event: LayoutChangeEvent) => void

    /**
     *
     * Style
     */
    style?: StyleProp<ImageStyle>

    /**
     * TintColor
     *
     * If supplied, changes the color of all the non-transparent pixels to the given color.
     */

    tintColor?: number | string

    /**
     * A unique identifier for this element to be used in UI Automation testing scripts.
     */
    testID?: string

    /**
     * Render children within the image.
     */
    children?: React.ReactNode
}

function FastImageBase({
    source,
    tintColor,
    onLoadStart,
    onProgress,
    onLoad,
    onError,
    onLoadEnd,
    style,
    fallback,
    children,
    resizeMode = ResizeMode.cover,
    forwardedRef,
    ...props
}: FastImageProps & { forwardedRef: React.Ref<any> }) {
    const resolvedSource = Image.resolveAssetSource(source as any)

    if (fallback) {
        return (
            <View style={[styles.imageContainer, style]} ref={forwardedRef}>
                <Image
                    {...props}
                    style={StyleSheet.absoluteFill}
                    source={resolvedSource}
                    onLoadStart={onLoadStart}
                    onProgress={onProgress}
                    onLoad={onLoad as any}
                    onError={onError}
                    onLoadEnd={onLoadEnd}
                    resizeMode={resizeMode}
                />
                {children}
            </View>
        )
    }

    return (
        <View style={[styles.imageContainer, style]} ref={forwardedRef}>
            <FastImageView
                {...props}
                tintColor={tintColor}
                style={StyleSheet.absoluteFill}
                source={resolvedSource}
                onFastImageLoadStart={onLoadStart}
                onFastImageProgress={onProgress}
                onFastImageLoad={onLoad}
                onFastImageError={onError}
                onFastImageLoadEnd={onLoadEnd}
                resizeMode={resizeMode}
            />
            {children}
        </View>
    )
}

const FastImageMemo = memo(FastImageBase)

export const FastImage = forwardRef(
    (props: FastImageProps, ref: React.Ref<any>) => (
        <FastImageMemo forwardedRef={ref} {...props} />
    ),
)

FastImage.displayName = 'FastImage'

const styles = StyleSheet.create({
    imageContainer: {
        overflow: 'hidden',
    },
})

export const preload = (sources: Source[]) => {
    FastImageViewNativeModule.preload(sources)
}

// Types of requireNativeComponent are not correct.
const FastImageView = (requireNativeComponent as any)(
    'FastImageView',
    FastImage,
    {
        nativeOnly: {
            onFastImageLoadStart: true,
            onFastImageProgress: true,
            onFastImageLoad: true,
            onFastImageError: true,
            onFastImageLoadEnd: true,
        },
    },
)
