#!/usr/bin/perl -w
use strict;
use warnings;

use POSIX;
use Getopt::Long;
use Pod::Usage;

require 'enum_time_patterns.pl';

my $granul;
my $time_lower_str;
my $time_lower;
my $time_upper_str;
my $time_upper;

my $time_before_str;
my $time_before;
my $time_after_str;
my $time_after;

my $verbose;
my $help = 0;
my $man = 0;

GetOptions(
        "granularity|g=s"   => \$granul,
        "time-interval|t=s" => \$time_lower_str,
        "beforehand|b:s"    => \$time_before_str,
        "afterwards|a:s"    => \$time_after_str,
        
        "verbose|v"         => \$verbose,
        "help|?"            => \$help, man => \$man
) or pod2usage(2);

#pod2usage(1) if $help;
pod2usage(-exitstatus => 0, -verbose => 2) if $help; #$man;

my $choices;

defined($time_lower_str) or die "'time-interval' is not specified";
defined($granul) or die "'granularity' is not specified";

chomp $granul;
    
$choices = join('|', &GRANULARITY_CHOICES);
$granul =~ /$choices/ or die "'granularity' value is invalid";

my $pattern_time = &PATTERN_TIME_INPUT;

if($time_lower_str) {
    chomp $time_lower_str;
    
    ($time_lower_str, $time_upper_str) = split(/,/, $time_lower_str);
}

if(not defined $time_upper_str) {
    $time_upper_str = $time_lower_str;
}

$time_lower = $time_lower_str;
$time_upper = $time_upper_str;


my($before_sec,$before_min,$before_hour,$before_day,$before_mon,$before_year)
= (          0,          0,           0,          0,          0,           0);

if($time_before_str) {
    ($before_sec,$before_min,$before_hour,$before_day,$before_mon,$before_year)
    = &parse_time_delta($time_before_str);
}

my($after_sec,$after_min,$after_hour,$after_day,$after_mon,$after_year)
= (         0,         0,          0,         0,         0,          0);

if($time_after_str) {
    ($after_sec,$after_min,$after_hour,$after_day,$after_mon,$after_year)
    = &parse_time_delta($time_after_str);
}


if(not $time_lower) {  # disabling time interval
    $time_lower = 0;
}
else {
    if($time_lower =~ /$pattern_time/) {
        $time_lower = &timestr2epoch( $1-$before_year, $2-$before_mon, ($3||1)-$before_day, ($4||0)-$before_hour, ($5||0)-$before_min, 0-$before_sec );
    }
    else {
        die "Unknown time format $time_lower";
    }
}

if(not $time_upper) {
    $time_upper = time;
}
else {
    if($time_upper =~ /$pattern_time/) {
        my $time_last = &timestr2epoch( $1, $2+1, $3||1, $4||0, $5||0, 0 );
        $time_last--;
        
        #    0    1    2     3     4    5     6     7     8
        my($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime($time_last);
        
        $time_upper = &timestr2epoch( $1+$after_year, $2+$after_mon, ($3||$mday)+$after_day, ($4||$hour)+$after_hour, ($5||$min)+$after_min, 59+$after_sec );
    }
    else {
        die "Unknown time format $time_upper";
    }
}

if($verbose) {
    print STDERR ctime($time_lower) . " ~ " . ctime($time_upper) . "\n";
    print STDERR &get_time_compact($time_lower) . " ~ " . &get_time_compact($time_upper) . "\n";
}

my($time_lower_sec,$time_lower_min,$time_lower_hour,$time_lower_mday,$time_lower_mon,$time_lower_year,$time_lower_wday,$time_lower_yday,$time_lower_isdst) = localtime($time_lower);
my($time_upper_sec,$time_upper_min,$time_upper_hour,$time_upper_mday,$time_upper_mon,$time_upper_year,$time_upper_wday,$time_upper_yday,$time_upper_isdst) = localtime($time_upper);

my($delta_sec,$delta_min,$delta_hour,$delta_mday,$delta_mon,$delta_year,$delta_wday,$delta_yday,$delta_isdst)
= (         0,         0,          0,          0,         0,          0,          0,          0,           0);

if($granul eq 'YEAR') {
    $delta_year = 1;
}
if($granul eq 'MONTH') {
    $delta_mon = 1;
}
if($granul eq 'DAY') {
    $delta_mday = 1;
}
if($granul eq 'HOUR') {
    $delta_hour = 1;
}
if($granul eq 'MINUTE') {
    $delta_min = 1;
}
if($granul eq 'SECOND') {
    $delta_sec = 1;
}

my $this_time = POSIX::mktime($time_lower_sec,$time_lower_min,$time_lower_hour,$time_lower_mday,$time_lower_mon,$time_lower_year);
my($this_sec,$this_min,$this_hour,$this_mday,$this_mon,$this_year,$this_wday,$this_yday,$this_isdst) = localtime($this_time);

while(time_cmp($this_time, $time_upper) <= 0) {
    if($verbose) {
        print STDERR ctime($this_time);
    }

    my $year = $this_year + 1900;
    my $month = $this_mon + 1;
    print STDOUT &get_output_datetime(&get_time_compact($this_time));
    #print STDOUT " ";
    #print STDOUT &get_time_compact($this_time, ' ');
    print STDOUT "\n";

    $this_sec += $delta_sec;
    $this_min += $delta_min;
    $this_hour += $delta_hour;
    $this_mday += $delta_mday;
    $this_mon += $delta_mon;
    $this_year += $delta_year;
    $this_wday += $delta_wday;
    $this_yday += $delta_yday;
    $this_isdst += $delta_isdst;
    $this_time = POSIX::mktime($this_sec,$this_min,$this_hour,$this_mday,$this_mon,$this_year,$this_wday,$this_yday,$this_isdst);
    ($this_sec,$this_min,$this_hour,$this_mday,$this_mon,$this_year,$this_wday,$this_yday,$this_isdst) = localtime($this_time);
}


exit;


sub parse_time_delta {
    my $delta_str = shift;
    my($delta_sec,$delta_min,$delta_hour,$delta_day,$delta_mon,$delta_year,$delta_week)
    = (         0,         0,          0,         0,         0,          0,          0);
    
    my $pattern = &PATTERN_TIME_DELTA();
    while($delta_str =~ /$pattern/) {
        my $delta_val = $1;
        my $delta_unit = $2;
        $delta_str = $';
        if($delta_unit =~ /Y/i) {
            $delta_year = $delta_val;
        }
        if($delta_unit =~ /M/i) {
            $delta_mon = $delta_val;
        }
        if($delta_unit =~ /D/i) {
            $delta_day = $delta_val;
        }
        if($delta_unit =~ /W/i) {
            $delta_week = $delta_val;
        }
        if($delta_unit =~ /H/i) {
            $delta_hour = $delta_val;
        }
        if($delta_unit =~ /I/i) {
            $delta_min = $delta_val;
        }
        if($delta_unit =~ /S/i) {
            $delta_sec = $delta_val;
        }
    }
    
    return ($delta_sec,$delta_min,$delta_hour,$delta_day,$delta_mon,$delta_year,$delta_week);
}

sub time_cmp {
    if(@_ < 2) {
        return undef;
    }
    
    my $gran = defined($granul)? ($granul) : (&GRANULARITY_CHOICES)[0];
    
    my @tm_a = localtime($_[0]);
    my @tm_b = localtime($_[1]);

    #    0    1    2     3     4    5     6     7     8
    # ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(...)
    
    for(my $i = 5; $i > 0; $i--) {
        return $tm_a[$i] - $tm_b[$i] unless $tm_a[$i] == $tm_b[$i];
        
        return $tm_a[$i] - $tm_b[$i]
        if($gran eq 'YEAR'   && $i == 5
        || $gran eq 'MONTH'  && $i == 4
        || $gran eq 'DAY'    && $i == 3
        || $gran eq 'HOUR'   && $i == 2
        || $gran eq 'MINUTE' && $i == 1
        || $gran eq 'SECOND' && $i == 0);
    }
}

sub get_time_compact {
    my $sep = '';
    if(defined $_[1]) {
        $sep = $_[1];
    }
    
    my $pattern = '%Y';
    unless($granul eq 'YEAR') {
        $pattern .= $sep . '%m';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH') {
        $pattern .= $sep . '%d';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH' || $granul eq 'DAY') {
        $pattern .= $sep . '%H';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH' || $granul eq 'DAY' || $granul eq 'HOUR') {
        $pattern .= $sep . '%M';
    }
    unless($granul eq 'YEAR' || $granul eq 'MONTH' || $granul eq 'DAY' || $granul eq 'HOUR' || $granul eq 'MINUTE') {
        $pattern .= '%S';
    }
    
    #    0    1    2     3     4    5     6     7     8
    # ($sec,$min,$hour,$mday,$mon,$year,$wday,$yday,$isdst) = localtime(...)
    
    return strftime($pattern, localtime($_[0]));
}

sub timestr2epoch {
    my($year, $month, $day, $hour, $minute, $second) = @_;
    if($year > 1900) {
        $year -= 1900;
    }
    $month--;

    # sec, min, hour, mday, mon, year
    return POSIX::mktime( $second, $minute, $hour, $day, $month, $year );
}

sub get_output_datetime {
    my $pattern = &PATTERN_RESULT_DATETIME;
    
    my $str_time_interval = shift;
    $pattern =~ s/\{TIME-INTERVAL\}/$str_time_interval/g;
    
    return $pattern;
}

sub trim {
    my $string = shift;
    $string =~ s/^\s+//;
    $string =~ s/\s+$//;
    return $string;
}


__END__


=head1 NAME

ENUM_TIME - Enumerate time items

=head1 SYNOPSIS

enum_time [options] log_path

    log_path    path to log files
    options     see OPTIONS

=head1 OPTIONS

=over 8

=item B<--granularity, -g>

Report time granularity. Necessary and unique. Available choices: MINUTE, HOUR, DAY, MONTH.

=item B<--time-interval, -t>

Time interval, comma (,) separated. Necessary and unique. 
Typical time format: 2010-7-10+8:30    20100710    2010-7

=item B<--help, -h, -?>

Print this help message.

=back

=pod

=head1 DESCRIPTION

B<This program> will read the given log file(s) and do statistics.

=head1 EXAMPLE

    --granularity HOUR --time-interval 2010-7-2,20100703
    -g HOUR --time-interval 2010-4,
    --granularity HOUR --time-interval 2010-7-2,20100703 --beforehand 1D2H --afterwards 3H15M
    
=cut
