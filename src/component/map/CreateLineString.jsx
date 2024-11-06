import React, { useRef, useEffect, useState } from 'react';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import { Stroke, Style } from 'ol/style';
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
    const [lineActive, setLineActive] = useState(false);

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

        if (lineActive) {
            // Create the Draw interaction for lines
            draw = new Draw({
                source: source,
                type: 'LineString',
                style: new Style({
                    stroke: new Stroke({
                        color: '#FF0000',
                        width: 2,
                    }),
                }),
            });

            // Clear existing lines when a new line drawing starts
            draw.on('drawstart', () => {
                source.clear();
            });

            draw.on('drawend', (event) => {
                const line = event.feature;
                const coordinates = line.getGeometry().getCoordinates();
                
                // Convert line coordinates to lon/lat for database storage
                const lonLatCoords = coordinates.map(coord => toLonLat(coord));
                
                // Example API call to save line to the database
                axios.post('http://localhost:4040/api/save/line', {
                    coordinates: lonLatCoords
                })
                .then(response => console.log("Line saved:", response.data))
                .catch(error => console.error("Error saving line:", error));
                
                console.log("Line coordinates:", lonLatCoords);
            });

            map.addInteraction(draw);
        }

        return () => {
            if (draw) map.removeInteraction(draw);
            map.setTarget(null);
        };
    }, [lineActive]);

    const handleLineToggle = () => {
        setLineActive(!lineActive);
    };

    return (
        <div>
            <div ref={mapRef} className="map" style={{ width: '100%', height: '90vh' }} />
            <div>
                <button onClick={handleLineToggle}>
                    {lineActive ? 'Disable Line Drawing' : 'Enable Line Drawing'}
                </button>
            </div>
        </div>
    );
};

export default Map;
