import React, { useRef, useEffect, useState } from 'react';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import { Draw } from 'ol/interaction';
import 'ol/ol.css';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import axios from 'axios';

const GoogleMap = new TileLayer({
    title: 'Google',
    type: 'base',
    source: new XYZ({
        url: 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
    })
});

const Map = () => {
    const mapRef = useRef(null);
    const [pointActive, setPointActive] = useState(false);

    useEffect(() => {
        const map = new OlMap({
            target: mapRef.current,
            layers: [
                new LayerGroup({
                    title: 'Base Map',
                    name: 'Base',
                    layers: [GoogleMap],
                })
            ],
            view: new OlView({
                center: fromLonLat([90.4125, 23.8103]),
                zoom: 12,
            }),
        });

        const source = new OlSourceVector();
        const layer = new OlLayerVector({
            source: source,
        });
        map.addLayer(layer);

        let draw;

        if (pointActive) {
            // Create the Draw interaction for points
            draw = new Draw({
                source: source,
                type: 'Point',
                style: new Style({
                    image: new CircleStyle({
                        radius: 6,
                        fill: new Fill({ color: '#FF0000' }),
                        stroke: new Stroke({ color: '#000000', width: 2 }),
                    }),
                }),
            });

            // Clear existing points when a new point drawing starts
            draw.on('drawstart', () => {
                source.clear();
            });

            draw.on('drawend', (event) => {
                const point = event.feature;
                const coordinates = point.getGeometry().getCoordinates();

                // Convert point coordinates to lon/lat for database storage
                const lonLatCoords = toLonLat(coordinates);

                // Example API call to save point to the database
                axios.post('http://localhost:4040/api/save/point', {
                    coordinates: lonLatCoords
                })
                .then(response => console.log("Point saved:", response.data))
                .catch(error => console.error("Error saving point:", error));

                console.log("Point coordinates:", lonLatCoords);
            });

            map.addInteraction(draw);
        }

        return () => {
            if (draw) map.removeInteraction(draw);
            map.setTarget(null);
        };
    }, [pointActive]);

    const handlePointToggle = () => {
        setPointActive(!pointActive);
    };

    return (
        <div>
            <div ref={mapRef} className="map" style={{ width: '100%', height: '90vh' }} />
            <div>
                <button onClick={handlePointToggle}>
                    {pointActive ? 'Disable Point Drawing' : 'Enable Point Drawing'}
                </button>
            </div>
        </div>
    );
};

export default Map;
