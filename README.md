# Placemarker

## Setup

1. **Install dependencies**:
   ```bash
   bun install
   ```

2. **Get a Mapbox Access Token**:
   - Go to [mapbox.com](https://www.mapbox.com/) and create a free account
   - Navigate to your Account Settings
   - Copy your default public access token

3. **Configure Environment**:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and replace `your_mapbox_access_token_here` with your actual token.

4. **Start Development Server**:
   ```bash
   bun run dev
   ```

## WorldMap Component Usage

The `WorldMap` component is fully typed and customizable:

```tsx
import WorldMap from '@/components/WorldMap';

function MyApp() {
  return (
    <WorldMap 
      accessToken="your_mapbox_token"
      width="100%"
      height="500px"
      initialZoom={2}
      initialCenter={[0, 20]}
      borderColor="#ffffff"
      borderWidth={1.5}
      mapStyle="mapbox://styles/mapbox/satellite-v9"
      onMapLoad={(map) => console.log('Map loaded', map)}
      onMapError={(error) => console.error('Map error', error)}
    />
  );
}
```

### Props

| Prop            | Type                          | Required | Default                                 | Description                          |
| --------------- | ----------------------------- | -------- | --------------------------------------- | ------------------------------------ |
| `accessToken`   | `string`                      | ✅        | -                                       | Mapbox access token                  |
| `width`         | `string \| number`            | ❌        | `"100%"`                                | Container width                      |
| `height`        | `string \| number`            | ❌        | `"500px"`                               | Container height                     |
| `initialZoom`   | `number`                      | ❌        | `2`                                     | Initial zoom level (0-24)            |
| `initialCenter` | `[number, number]`            | ❌        | `[0, 20]`                               | Initial center [longitude, latitude] |
| `borderColor`   | `string`                      | ❌        | `"#ffffff"`                             | Country border color                 |
| `borderWidth`   | `number`                      | ❌        | `2`                                     | Country border width                 |
| `mapStyle`      | `string`                      | ❌        | `"mapbox://styles/mapbox/satellite-v9"` | Mapbox style URL                     |
| `onMapLoad`     | `(map: mapboxgl.Map) => void` | ❌        | -                                       | Callback when map loads              |
| `onMapError`    | `(error: Error) => void`      | ❌        | -                                       | Callback for errors                  |


