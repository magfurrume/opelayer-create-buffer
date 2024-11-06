import React, { useRef, useEffect, useState } from 'react';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { fromLonLat, toLonLat } from 'ol/proj';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import { Fill, Stroke, Style } from 'ol/style';
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
    const [polygonActive, setPolygonActive] = useState(false);

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

        if (polygonActive) {
            // Create the Draw interaction for polygons
            draw = new Draw({
                source: source,
                type: 'Polygon',
                style: new Style({
                    fill: new Fill({
                        color: 'rgba(0, 0, 255, 0.2)',
                    }),
                    stroke: new Stroke({
                        color: '#0000FF',
                        width: 2,
                    }),
                }),
            });

            draw.on('drawend', (event) => {
                const polygon = event.feature;
                const coordinates = polygon.getGeometry().getCoordinates();
                
                // Convert polygon coordinates to lon/lat for database storage
                const lonLatCoords = coordinates[0].map(coord => toLonLat(coord));
                
                // Example API call to save polygon to the database
                // axios.post('http://localhost:4040/api/save/polygon', {
                //     coordinates: lonLatCoords
                // })
                // .then(response => console.log("Polygon saved:", response.data))
                // .catch(error => console.error("Error saving polygon:", error));
                
                console.log("Polygon coordinates:", lonLatCoords);
            });

            map.addInteraction(draw);
        }

        return () => {
            if (draw) map.removeInteraction(draw);
            map.setTarget(null);
        };
    }, [polygonActive]);

    const handlePolygonToggle = () => {
        setPolygonActive(!polygonActive);
    };

    return (
        <div>
            <div ref={mapRef} className="map" style={{ width: '100%', height: '90vh' }} />
            <div>
                <button onClick={handlePolygonToggle}>
                    {polygonActive ? 'Disable Polygon Drawing' : 'Enable Polygon Drawing'}
                </button>
            </div>
        </div>
    );
};

export default Map;
