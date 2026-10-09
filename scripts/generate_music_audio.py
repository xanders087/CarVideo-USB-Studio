#!/usr/bin/env python3
import math
import struct
import wave
import os
import subprocess

SAMPLE_RATE = 44100

def note_freq(semitones_from_a4):
    """Returns frequency in Hz given semitones from A4 (440 Hz)"""
    return 440.0 * (2.0 ** (semitones_from_a4 / 12.0))

# Standard notes relative to A4 (0)
# C4 = -9, D4 = -7, E4 = -5, F4 = -4, G4 = -2, A4 = 0, B4 = 2, C5 = 3
NOTES = {
    'C3': -21, 'D3': -19, 'E3': -17, 'F3': -16, 'G3': -14, 'A3': -12, 'B3': -10,
    'C4': -9,  'D4': -7,  'E4': -5,  'F4': -4,  'G4': -2,  'A4': 0,   'B4': 2,
    'C5': 3,   'D5': 5,   'E5': 7,   'F5': 8,   'G5': 10,  'A5': 12,  'B5': 14,
    'C6': 15,  'E6': 19,  'G6': 22,
    'F#3': -15, 'F#4': -3, 'F#5': 9,
    'G#3': -13, 'G#4': -1, 'G#5': 11,
    'Bb3': -11, 'Bb4': 1,  'Bb5': 13,
    'Eb4': -6,  'Eb5': 6
}

def generate_sine(freq, duration_sec, amplitude=0.5, vibrato=False):
    samples = []
    num_samples = int(duration_sec * SAMPLE_RATE)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        # Envelope: subtle attack and release
        env = 1.0
        if i < 441: # 10ms attack
            env = i / 441.0
        elif i > num_samples - 882: # 20ms release
            env = max(0.0, (num_samples - i) / 882.0)
            
        f = freq
        if vibrato:
            f = freq * (1.0 + 0.015 * math.sin(2.0 * math.pi * 5.5 * t))
            
        val = amplitude * env * math.sin(2.0 * math.pi * f * t)
        samples.append(val)
    return samples

def generate_reed_accordion(freq, duration_sec, amplitude=0.4):
    """Accordion/reed sound: fundamental + rich 2nd, 3rd, 4th harmonics + tremolo"""
    samples = []
    num_samples = int(duration_sec * SAMPLE_RATE)
    for i in range(num_samples):
        t = i / SAMPLE_RATE
        env = min(1.0, i / 600.0) * max(0.0, min(1.0, (num_samples - i) / 1000.0))
        tremolo = 1.0 + 0.08 * math.sin(2.0 * math.pi * 6.0 * t)
        vibrato = 1.0 + 0.008 * math.sin(2.0 * math.pi * 5.0 * t)
        f = freq * vibrato
        
        # Reed harmonics
        s1 = math.sin(2.0 * math.pi * f * t)
        s2 = 0.5 * math.sin(2.0 * math.pi * 2.0 * f * t)
        s3 = 0.3 * math.sin(2.0 * math.pi * 3.0 * f * t)
        s4 = 0.15 * math.sin(2.0 * math.pi * 4.0 * f * t)
        val = amplitude * env * tremolo * (s1 + s2 + s3 + s4) / 1.95
        samples.append(val)
    return samples

def generate_vallenato_track(duration=20.0):
    """Generates an upbeat Colombian Vallenato Paseo rhythm & accordion melody"""
    num_samples = int(duration * SAMPLE_RATE)
    left = [0.0] * num_samples
    right = [0.0] * num_samples
    
    # Chord progression: G - C - D - C (Classic Paseo Vallenato)
    progression = [
        ('G', [NOTES['G4'], NOTES['B4'], NOTES['D5']], NOTES['G3']),
        ('C', [NOTES['C4'], NOTES['E4'], NOTES['G4']], NOTES['C3']),
        ('D', [NOTES['D4'], NOTES['F#4'], NOTES['A4']], NOTES['D3']),
        ('C', [NOTES['C4'], NOTES['E4'], NOTES['G4']], NOTES['C3'])
    ]
    
    beat_sec = 0.38 # ~158 BPM Paseo Vallenato
    total_beats = int(duration / beat_sec)
    
    for b in range(total_beats):
        t_start = int(b * beat_sec * SAMPLE_RATE)
        chord_idx = (b // 4) % len(progression)
        _, notes, bass_note = progression[chord_idx]
        
        # 1. Bassline (Caja/Bajo syncopated)
        if b % 2 == 0:
            bass_samples = generate_sine(note_freq(bass_note), beat_sec * 0.9, amplitude=0.45)
            for i, val in enumerate(bass_samples):
                if t_start + i < num_samples:
                    left[t_start + i] += val * 0.7
                    right[t_start + i] += val * 0.7
                    
        # 2. Accordion chord strum on beats 2 & 4 + melody riff
        acc_note = notes[(b % len(notes))]
        acc_samples = generate_reed_accordion(note_freq(acc_note), beat_sec * 0.85, amplitude=0.35)
        harmony_samples = generate_reed_accordion(note_freq(acc_note + 4), beat_sec * 0.85, amplitude=0.25)
        
        # Guacharaca rasp on 16th notes
        for sixteenth in range(4):
            tick_start = t_start + int(sixteenth * (beat_sec / 4) * SAMPLE_RATE)
            rasp_len = int(0.04 * SAMPLE_RATE)
            for i in range(rasp_len):
                if tick_start + i < num_samples:
                    # White noise burst for guacharaca
                    noise = (float((i * 1337 + b * 997) % 100) / 50.0 - 1.0) * 0.12
                    left[tick_start + i] += noise * 0.8
                    right[tick_start + i] += noise * 0.5
                    
        for i in range(len(acc_samples)):
            if t_start + i < num_samples:
                # Accordion spread stereo
                left[t_start + i] += acc_samples[i] * 0.85 + harmony_samples[i] * 0.3
                right[t_start + i] += acc_samples[i] * 0.35 + harmony_samples[i] * 0.85

    return left, right

def generate_synthwave_track(duration=20.0):
    """80s Synthwave retro highway driving track"""
    num_samples = int(duration * SAMPLE_RATE)
    left = [0.0] * num_samples
    right = [0.0] * num_samples
    
    # Am - F - C - G
    progression = [
        ('Am', NOTES['A3'], [NOTES['A4'], NOTES['C5'], NOTES['E5']]),
        ('F',  NOTES['F3'], [NOTES['F4'], NOTES['A4'], NOTES['C5']]),
        ('C',  NOTES['C3'], [NOTES['C4'], NOTES['E4'], NOTES['G4']]),
        ('G',  NOTES['G3'], [NOTES['G4'], NOTES['B4'], NOTES['D5']])
    ]
    
    beat_sec = 0.5 # 120 BPM
    total_beats = int(duration / beat_sec)
    
    for b in range(total_beats):
        t_start = int(b * beat_sec * SAMPLE_RATE)
        p_idx = (b // 4) % len(progression)
        _, bass, chord_notes = progression[p_idx]
        
        # 16th-note pulsing synth bass
        for sixteenth in range(4):
            sub_start = t_start + int(sixteenth * (beat_sec / 4.0) * SAMPLE_RATE)
            bass_s = generate_sine(note_freq(bass), beat_sec * 0.22, amplitude=0.4)
            for i, val in enumerate(bass_s):
                if sub_start + i < num_samples:
                    left[sub_start + i] += val * 0.6
                    right[sub_start + i] += val * 0.6
                    
        # Retro lead synth pad
        lead_note = chord_notes[b % len(chord_notes)]
        lead_s = generate_sine(note_freq(lead_note), beat_sec * 0.95, amplitude=0.3, vibrato=True)
        for i, val in enumerate(lead_s):
            if t_start + i < num_samples:
                left[t_start + i] += val * 0.8
                right[t_start + i] += val * 0.4
                
        # Kick drum on 1 and 3, Snare on 2 and 4
        if b % 2 == 0:
            # Kick
            k_len = int(0.15 * SAMPLE_RATE)
            for i in range(k_len):
                if t_start + i < num_samples:
                    k_env = max(0.0, 1.0 - (i / k_len))
                    k_val = k_env * 0.6 * math.sin(2 * math.pi * (110.0 - 70.0 * (i / k_len)) * (i / SAMPLE_RATE))
                    left[t_start + i] += k_val
                    right[t_start + i] += k_val
        else:
            # Snare noise
            s_len = int(0.12 * SAMPLE_RATE)
            for i in range(s_len):
                if t_start + i < num_samples:
                    s_env = max(0.0, 1.0 - (i / s_len))
                    noise = (float((i * 877 + b * 433) % 100) / 50.0 - 1.0) * 0.25 * s_env
                    left[t_start + i] += noise
                    right[t_start + i] += noise

    return left, right

def generate_rock_track(duration=20.0):
    """Driving Highway Rock with power chords and drums"""
    num_samples = int(duration * SAMPLE_RATE)
    left = [0.0] * num_samples
    right = [0.0] * num_samples
    
    progression = [NOTES['E3'], NOTES['G3'], NOTES['A3'], NOTES['D3']]
    beat_sec = 0.44 # ~136 BPM
    total_beats = int(duration / beat_sec)
    
    for b in range(total_beats):
        t_start = int(b * beat_sec * SAMPLE_RATE)
        root = progression[(b // 2) % len(progression)]
        fifth = root + 7
        
        r_s = generate_sine(note_freq(root), beat_sec * 0.85, amplitude=0.35)
        f_s = generate_sine(note_freq(fifth), beat_sec * 0.85, amplitude=0.3)
        
        for i in range(len(r_s)):
            if t_start + i < num_samples:
                val = (r_s[i] + f_s[i])
                # Soft overdrive distortion
                val = math.tanh(val * 1.5) * 0.5
                left[t_start + i] += val * 0.9
                right[t_start + i] += val * 0.7
                
        # Rock Kick & Snare
        if b % 2 == 0:
            k_len = int(0.18 * SAMPLE_RATE)
            for i in range(k_len):
                if t_start + i < num_samples:
                    k_env = max(0.0, 1.0 - (i / k_len))
                    k_val = k_env * 0.5 * math.sin(2 * math.pi * (130.0 - 80.0 * (i / k_len)) * (i / SAMPLE_RATE))
                    left[t_start + i] += k_val
                    right[t_start + i] += k_val
        else:
            s_len = int(0.14 * SAMPLE_RATE)
            for i in range(s_len):
                if t_start + i < num_samples:
                    s_env = max(0.0, 1.0 - (i / s_len))
                    noise = (float((i * 617 + b * 223) % 100) / 50.0 - 1.0) * 0.3 * s_env
                    left[t_start + i] += noise
                    right[t_start + i] += noise

    return left, right

def generate_latin_pop_track(duration=20.0):
    """Tropical Latin pop rhythm with piano chords and bright percussion"""
    num_samples = int(duration * SAMPLE_RATE)
    left = [0.0] * num_samples
    right = [0.0] * num_samples
    
    progression = [
        (NOTES['C4'], NOTES['E4'], NOTES['G4']),
        (NOTES['A3'], NOTES['C4'], NOTES['E4']),
        (NOTES['F3'], NOTES['A3'], NOTES['C4']),
        (NOTES['G3'], NOTES['B3'], NOTES['D4'])
    ]
    beat_sec = 0.48 # 125 BPM
    total_beats = int(duration / beat_sec)
    
    for b in range(total_beats):
        t_start = int(b * beat_sec * SAMPLE_RATE)
        chord = progression[(b // 4) % len(progression)]
        
        # Syncopated montuno hits on upbeat
        for note in chord:
            p_s = generate_sine(note_freq(note), beat_sec * 0.6, amplitude=0.22)
            upbeat = t_start + int(0.5 * beat_sec * SAMPLE_RATE)
            for i, val in enumerate(p_s):
                if upbeat + i < num_samples:
                    left[upbeat + i] += val * 0.8
                    right[upbeat + i] += val * 0.5
                    
        # Shaker and conga rhythm
        for sixteenth in range(4):
            tick = t_start + int(sixteenth * (beat_sec / 4) * SAMPLE_RATE)
            for i in range(int(0.03 * SAMPLE_RATE)):
                if tick + i < num_samples:
                    shaker = (float((i * 457 + b * 811) % 100) / 50.0 - 1.0) * 0.08
                    left[tick + i] += shaker
                    right[tick + i] += shaker

    return left, right

def generate_stereo_test_track(duration=18.0):
    """Clear automotive stereo diagnostics test with harmonic tones"""
    num_samples = int(duration * SAMPLE_RATE)
    left = [0.0] * num_samples
    right = [0.0] * num_samples
    
    # 0-5s: Left Channel Only (warm pleasant chime in D5)
    for b in range(4):
        t_start = int((1.0 + b * 0.9) * SAMPLE_RATE)
        chime = generate_sine(note_freq(NOTES['D5']), 0.6, amplitude=0.45)
        for i, val in enumerate(chime):
            if t_start + i < num_samples:
                left[t_start + i] += val
                
    # 5-10s: Right Channel Only (warm pleasant chime in F#5)
    for b in range(4):
        t_start = int((6.0 + b * 0.9) * SAMPLE_RATE)
        chime = generate_sine(note_freq(NOTES['F#5']), 0.6, amplitude=0.45)
        for i, val in enumerate(chime):
            if t_start + i < num_samples:
                right[t_start + i] += val
                
    # 10-18s: Both Channels Full Stereo Harmonic Accord (D - F# - A - D)
    for b in range(8):
        t_start = int((10.5 + b * 0.85) * SAMPLE_RATE)
        chime_l = generate_sine(note_freq(NOTES['A4']), 0.7, amplitude=0.35)
        chime_r = generate_sine(note_freq(NOTES['D5']), 0.7, amplitude=0.35)
        bass = generate_sine(note_freq(NOTES['D3']), 0.7, amplitude=0.4)
        for i in range(len(chime_l)):
            if t_start + i < num_samples:
                left[t_start + i] += chime_l[i] + bass[i] * 0.5
                right[t_start + i] += chime_r[i] + bass[i] * 0.5
                
    return left, right

def save_wav(filename, left, right):
    """Normalizes and exports 16-bit PCM stereo WAV"""
    max_amp = max(max(abs(x) for x in left), max(abs(x) for x in right), 0.001)
    scale = 0.92 / max_amp
    
    with wave.open(filename, 'wb') as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        frames = bytearray()
        for l_val, r_val in zip(left, right):
            l_int = int(max(-32767, min(32767, l_val * scale * 32767.0)))
            r_int = int(max(-32767, min(32767, r_val * scale * 32767.0)))
            frames.extend(struct.pack('<hh', l_int, r_int))
        wf.writeframes(frames)
    print(f"Saved audio WAV: {filename} ({len(left)/SAMPLE_RATE:.1f}s)")

def main():
    os.makedirs('/tmp/audio_tracks', exist_ok=True)
    os.makedirs('public/videos', exist_ok=True)
    
    print("1. Generating rich musical tracks...")
    vallenato_l, vallenato_r = generate_vallenato_track(22.0)
    save_wav('/tmp/audio_tracks/vallenato.wav', vallenato_l, vallenato_r)
    
    synth_l, synth_r = generate_synthwave_track(22.0)
    save_wav('/tmp/audio_tracks/synthwave.wav', synth_l, synth_r)
    
    rock_l, rock_r = generate_rock_track(22.0)
    save_wav('/tmp/audio_tracks/rock.wav', rock_l, rock_r)
    
    latin_l, latin_r = generate_latin_pop_track(22.0)
    save_wav('/tmp/audio_tracks/latin.wav', latin_l, latin_r)
    
    test_l, test_r = generate_stereo_test_track(18.0)
    save_wav('/tmp/audio_tracks/test.wav', test_l, test_r)

if __name__ == '__main__':
    main()
