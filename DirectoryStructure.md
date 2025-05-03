```tree
Pixelift
└── ./src
    ├── browser/
    │   ├── decoder/
    │   │   ├── canvas/
    │   │   │   └── index.ts          # Canvas-based decoder implementation
    │   │   ├── webcodecs/
    │   │   │   └── index.ts          # WebCodecs-based decoder implementation
    │   │   ├── index.ts              # Orchestrates browser decoders
    │   │   └── types.ts              # Browser decoder type definitions
    │   ├── index.ts                  # Main browser entry point
    │   ├── blob.ts                   # Browser-specific blob utilities
    │   └── types.ts                  # Browser-specific type definitions
    ├── server/
    │   ├── decoder/
    │   │   ├── index.ts              # Orchestrates server decoders
    │   │   └── sharp.ts              # Sharp-based decoder implementation
    │   ├── index.ts                  # Main server entry point
    │   ├── buffer.ts                 # Server-specific buffer utilities
    │   └── types.ts                  # Server-specific type definitions
    ├── shared/
    │   ├── decoder.ts                # NEW: Shared decoder interface/utilities
    │   ├── utils.ts                  # NEW: Combines conversion and validation
    │   ├── conversion.ts             # Pixel format conversion utilities
    │   ├── env.ts                    # Environment detection utilities
    │   └── error.ts                  # Error handling utilities
    └── index.ts                      # Universal entry point
```