import React, { useRef, useEffect, useState } from 'react';
import OlMap from 'ol/Map';
import OlView from 'ol/View';
import { transform, fromLonLat, toLonLat } from 'ol/proj';
import OlLayerVector from 'ol/layer/Vector';
import OlSourceVector from 'ol/source/Vector';
import OlFeature from 'ol/Feature';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Circle from 'ol/geom/Circle';
import { getDistance } from 'ol/sphere';
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
        //  url: 'https://khms1.googleapis.com/kh?v=152&hl=es-ES&x={x}&y={y}&z={z}'
    })
});

const Map = () => {
    const mapRef = useRef(null);
    const [bufferSize, setBufferSize] = useState(10); // Initial buffer size in meters
    const [bufferActive, setBufferActive] = useState(false);

    useEffect(() => {
        const map = new OlMap({
            target: mapRef.current,
            layers: [
                new LayerGroup({
                    title: 'Base Map',
                    name: 'Base',
                    fold: 'close',
                    layers: [GoogleMap],
                })
            ],
            view: new OlView({
                center: fromLonLat([90.4125, 23.8103]),
                zoom: 12,
                // projection: 'EPSG:4326'
            }),
        });

        const source = new OlSourceVector();
        const layer = new OlLayerVector({
            source: source,
        });
        map.addLayer(layer);

        const drawBuffer = (coordinate, radius) => {
            source.clear();

            const circle = new OlFeature(new Circle(coordinate, radius));
            circle.setStyle(
                new Style({
                    fill: new Fill({
                        color: 'rgba(255, 0, 0, 0.2)', // Change the color and opacity as needed
                    }),
                    stroke: new Stroke({
                        color: 'rgba(255, 0, 0, 0.8)', // Change the color and opacity as needed
                        width: 2,
                    }),
                })
            );
            source.addFeature(circle);
            // const center = circle.getGeometry().getCenter();
            // const circleRadius = circle.getGeometry().getRadius();

            // console.log('Buffered area center:', center);
            // console.log('Buffered area radius:', circleRadius);
        };
        if (bufferActive) {
            map.on('click', (event) => {
                const coordinate = event.coordinate;

                const bufferRadius = getDistance(
                    transform([coordinate[0], coordinate[1]], 'EPSG:3857', 'EPSG:4326'),
                    transform([coordinate[0] + bufferSize, coordinate[1]], 'EPSG:3857', 'EPSG:4326'),
                    6378137
                );

                drawBuffer(coordinate, bufferRadius);

                const lonLat = toLonLat(coordinate);

                /* Save Buffered Feature in postgres DB using rest api.
                here is the query 
                `INSERT INTO polygon (geom)
                            VALUES (
                            ST_SetSRID(ST_Multi(ST_Buffer(ST_MakePoint(
                                ${lon}, ${lat})::geography, ${radius})::geometry), 4326)
                            );`
                */

                axios.post(`http://localhost:4040/api/select/circle?lon=${lonLat[0]}&lat=${lonLat[1]}&radius=${bufferRadius}`)
                console.log('Clicked coordinate:', lonLat, bufferRadius);
            });
        }
        return () => {
            map.setTarget(null);
        };
    }, [bufferSize, bufferActive]);

    const handleBufferSizeChange = (event) => {
        setBufferSize(Number(event.target.value));
    };

    const handleBufferToggle = () => {
        setBufferActive(!bufferActive);
    };

    return (
        <div>
            <div ref={mapRef} className="map" id="map" style={{ width: '100%', height: '90vh' }} />
            <div>
                <label>Buffer Size (meters):</label>
                <input
                    type="number"
                    min="0"
                    step="10000"
                    value={bufferSize}
                    onChange={handleBufferSizeChange}
                />
                <button onClick={handleBufferToggle}>
                    {bufferActive ? 'Disable Buffer' : 'Enable Buffer'}
                </button>
            </div>
        </div>
    );
};

export default Map;
