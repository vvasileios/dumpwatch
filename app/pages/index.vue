<template>
    <div class="absolute inset-0">
        <ClientOnly>
            <MapView />
            <template #fallback>
                <AppLoader overlay size="lg" label="Loading map" :delay="0" />
            </template>
        </ClientOnly>
    </div>
</template>
