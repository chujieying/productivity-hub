"use client"

import React, { useState, useEffect } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Heart, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { StudySpot } from "@/lib/types"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Database } from '@/lib/types'
import { Session } from '@supabase/auth-helpers-nextjs'

// Define interfaces
interface StudySpot {
  id: string;
  name: string;
  location: string;
  coordinates: [number, number];
  amenities: string[];
  description: string;
}

interface FilterState {
  wifi: boolean;
  power: boolean;
  quiet: boolean;
}

// Fix for default marker icons in Leaflet with Next.js
const icon = L.icon({
  iconUrl: "/marker-icon.png",
  iconRetinaUrl: "/marker-icon-2x.png",
  shadowUrl: "/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface Filter {
  wifi: boolean
  food: boolean
  drinks: boolean
  charging: boolean
}

interface MapUpdaterProps {
  center: [number, number]
}

const MapUpdater: React.FC<MapUpdaterProps> = ({ center }) => {
  const map = useMap()
  useEffect(() => {
    map.setView(center, 13)
  }, [center, map])
  return null
}

// Configure the default marker icon
const defaultIcon = L.icon({
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

L.Marker.prototype.options.icon = defaultIcon

interface StudySpotMapProps {
  initialSpots?: StudySpot[]
}

export const StudySpotMap: React.FC<StudySpotMapProps> = ({ initialSpots = [] }) => {
  const [filters, setFilters] = useState<FilterState>({
    wifi: false,
    power: false,
    quiet: false
  });
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [favoriteSpots, setFavoriteSpots] = useState<StudySpot[]>([]);
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mapCenter, setMapCenter] = useState<[number, number]>([1.3521, 103.8198]); // Singapore coordinates
  const [searchResults, setSearchResults] = useState<StudySpot[]>([])
  const supabase = createClientComponentClient<Database>()

  // Check for user session
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    fetchUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Load favorite spots when user changes
  useEffect(() => {
    if (user) {
      fetchFavoriteSpots()
    } else {
      // If no user, try to load from localStorage
      const savedSpots = localStorage.getItem("productivityHubFavoriteSpots")
      if (savedSpots) {
        try {
          setFavoriteSpots(JSON.parse(savedSpots))
        } catch (e) {
          console.error("Failed to parse saved spots", e)
        }
      }
      setLoading(false)
    }
  }, [user])

  // Save favorite spots to localStorage when they change (for non-authenticated users)
  useEffect(() => {
    if (!user && favoriteSpots.length >= 0) {
      localStorage.setItem("productivityHubFavoriteSpots", JSON.stringify(favoriteSpots))
    }
  }, [favoriteSpots, user])

  // Fetch favorite spots from Supabase
  const fetchFavoriteSpots = async () => {
    try {
      const { data, error } = await supabase.from("study_spots").select("*").eq("user_id", user.id)

      if (error) throw error

      if (data) setFavoriteSpots(data)
    } catch (error) {
      console.error("Error fetching favorite spots:", error)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery + ', Singapore')}`
      );
      const data = await response.json();
      
      if (data && data[0]) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      }
    } catch (error) {
      console.error('Error searching location:', error);
    }
  };

  const toggleFilter = (filter: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [filter]: !prev[filter]
    }));
  };

  const toggleFavorite = (spot: StudySpot) => {
    setFavoriteSpots(prev => {
      const isFavorite = prev.some(s => s.id === spot.id);
      if (isFavorite) {
        return prev.filter(s => s.id !== spot.id);
      } else {
        return [...prev, spot];
      }
    });
  };

  const filteredSpots = initialSpots.filter(spot => {
    if (filters.wifi && !spot.amenities.includes('wifi')) return false;
    if (filters.power && !spot.amenities.includes('power')) return false;
    if (filters.quiet && !spot.amenities.includes('quiet')) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <div className="flex space-x-2">
          <Input
            type="text"
            placeholder="Search for study spots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSearch}>
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 mt-2">
          <div className="flex items-center space-x-2">
            <Checkbox id="filter-wifi" checked={filters.wifi} onCheckedChange={() => toggleFilter("wifi")} />
            <label htmlFor="filter-wifi">Wi-Fi</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="filter-power" checked={filters.power} onCheckedChange={() => toggleFilter("power")} />
            <label htmlFor="filter-power">Power</label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox id="filter-quiet" checked={filters.quiet} onCheckedChange={() => toggleFilter("quiet")} />
            <label htmlFor="filter-quiet">Quiet</label>
          </div>
        </div>
      </div>

      {favoriteSpots.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Your Favorite Spots</h3>
          <div className="flex flex-wrap gap-2">
            {favoriteSpots.map((spot) => (
              <Button key={spot.id} variant="outline" size="sm" onClick={() => toggleFavorite(spot)}>
                <Heart className="h-3 w-3 mr-1 text-red-500" />
                {spot.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="w-full h-[400px] rounded-lg border overflow-hidden">
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={mapCenter} />
          
          {/* Display search results */}
          {filteredSpots.map((spot) => (
            <Marker
              key={spot.id}
              position={spot.coordinates}
              icon={icon}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold">{spot.name}</h3>
                  <p className="text-sm text-gray-600">{spot.location}</p>
                  <p className="text-sm mt-2">{spot.description}</p>
                  <div className="flex gap-2 mt-2">
                    {spot.amenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleFavorite(spot)}
                    className="mt-2 p-1 hover:bg-gray-100 rounded-full"
                  >
                    {favoriteSpots.some((s) => s.id === spot.id) ? (
                      <Heart className="text-yellow-400" size={20} />
                    ) : (
                      <Heart size={20} />
                    )}
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          onClick={() => {
            const spotName = prompt("Enter the name of the spot:")
            const spotAddress = prompt("Enter the address (optional):")
            if (spotName) {
              toggleFavorite({
                id: Date.now().toString(),
                name: spotName,
                location: spotAddress || "",
                coordinates: [mapCenter[0], mapCenter[1]],
                amenities: [],
                description: ""
              })
            }
          }}
        >
          <Heart className="h-4 w-4 mr-2" />
          Save Current Location
        </Button>
      </div>
    </div>
  )
}

