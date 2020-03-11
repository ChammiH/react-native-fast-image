#import "FFFastImageViewManager.h"
#import "FFFastImageView.h"

#import <SDWebImage/SDWebImagePrefetcher.h>

@implementation FFFastImageViewManager

RCT_EXPORT_MODULE(FastImageView)

- (FFFastImageView*)view {
    [self setCacheConfigs];
    return [[FFFastImageView alloc] init];
}

// Using a work around here to make sure the config only runs once
// Move this to a constructor somewhere where it wil only run once
- (void)setCacheConfigs {
    float twoDaysOfSeconds = 3600 * 24 * 2;
    bool configNotSet = (SDImageCache.sharedImageCache.config.maxDiskAge != twoDaysOfSeconds);
    
    if (configNotSet) {
        float deviceMemory = [NSProcessInfo processInfo].physicalMemory;
        float deviceMemoryInGigs = deviceMemory / (1024.0 * 1024.0 * 1024.0);
        
        float halfOfDeviceMemory = deviceMemory * 0.5;
        float thirdOfDeviceMemory = deviceMemory * 0.33;
        
        SDImageCache.sharedImageCache.config.maxDiskAge = twoDaysOfSeconds;
        SDImageCache.sharedImageCache.config.maxMemoryCost = halfOfDeviceMemory;
        SDImageCache.sharedImageCache.config.diskCacheReadingOptions = NSDataReadingMappedIfSafe;
        
        SDWebImageManager.sharedManager.optionsProcessor = [SDWebImageOptionsProcessor optionsProcessorWithBlock:^SDWebImageOptionsResult * _Nullable(NSURL * _Nullable url, SDWebImageOptions options, SDWebImageContext * _Nullable context) {
             // Disable Force Decoding in global, may reduce the frame rate
             options |= SDWebImageAvoidDecodeImage;
             return [[SDWebImageOptionsResult alloc] initWithOptions:options context:context];
        }];
        
        if (deviceMemoryInGigs <= 1) {
            SDImageCache.sharedImageCache.config.maxMemoryCount = 25;
            SDImageCache.sharedImageCache.config.shouldCacheImagesInMemory = NO;
            SDImageCache.sharedImageCache.config.shouldUseWeakMemoryCache = NO;
            SDImageCache.sharedImageCache.config.maxMemoryCost = thirdOfDeviceMemory;
        }
    }
}

RCT_EXPORT_VIEW_PROPERTY(source, FFFastImageSource)
RCT_EXPORT_VIEW_PROPERTY(resizeMode, RCTResizeMode)
RCT_EXPORT_VIEW_PROPERTY(onFastImageLoadStart, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFastImageProgress, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFastImageError, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFastImageLoad, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(onFastImageLoadEnd, RCTDirectEventBlock)
RCT_REMAP_VIEW_PROPERTY(tintColor, imageColor, UIColor)

RCT_EXPORT_METHOD(preload:(nonnull NSArray<FFFastImageSource *> *)sources)
{
    NSMutableArray *urls = [NSMutableArray arrayWithCapacity:sources.count];

    [sources enumerateObjectsUsingBlock:^(FFFastImageSource * _Nonnull source, NSUInteger idx, BOOL * _Nonnull stop) {
        [source.headers enumerateKeysAndObjectsUsingBlock:^(NSString *key, NSString* header, BOOL *stop) {
            [[SDWebImageDownloader sharedDownloader] setValue:header forHTTPHeaderField:key];
        }];
        [urls setObject:source.url atIndexedSubscript:idx];
    }];

    [[SDWebImagePrefetcher sharedImagePrefetcher] prefetchURLs:urls];
}

@end

